import {
  createGame,
  currentRound,
  PlayerColor,
  PRESETS,
  PresetId,
  randomSeed,
  reduce,
  seededRng,
} from '@/domain';
import type { GameState, NamedPlayer, Profile, Rng } from '@/domain';
import { delay } from '@/lib';
import { SessionPhase, setActiveSession, TrainingSession } from '@/session';
import type { AnySession, GuestSession, HostSession, SessionSnapshot } from '@/session';
import { navigate, Route } from '@/shared';
import { useProfileStore, useStatsStore } from '@/store';

import { botMove } from './botMove';
import { Scenario } from './scenario';
import { Table } from './Table';

const ME: Profile = { name: 'Lukas', color: PlayerColor.Amber };
const OTHERS: Profile[] = [
  { name: 'Antonia', color: PlayerColor.Sky },
  { name: 'Jonas', color: PlayerColor.Coral },
  { name: 'Mira', color: PlayerColor.Mint },
  { name: 'Emil', color: PlayerColor.Lilac },
  { name: 'Lea', color: PlayerColor.Yellow },
];
/** Lets the phone on screen catch up with the host's last broadcast. */
const SYNC_MS = 300;
const HOUR_MS = 3_600_000;

type Destination = { route: Route; params?: Record<string, string> };
type Setup = (table: Table, rng: Rng) => Promise<Destination>;

/** The profile a returning player has; every scenario but onboarding starts with it. */
function signIn(): void {
  const profile = useProfileStore.getState();
  profile.saveProfile(ME);
  profile.completeOnboarding();
}

function inGame({ shared }: SessionSnapshot): boolean {
  return shared.phase === SessionPhase.Playing && shared.game !== null;
}

/** My turn, nothing rolled yet, from round `round` on. */
function myTurnFrom(round: number) {
  return (snapshot: SessionSnapshot) => {
    const game = snapshot.shared.game;

    return (
      inGame(snapshot) &&
      game!.turn.playerId === snapshot.myId &&
      game!.turn.rollsUsed === 0 &&
      currentRound(game!) >= round
    );
  };
}

/** A host with `guests` of the other players in its lobby. */
async function lobby(table: Table, host: Profile, guests: Profile[]) {
  const session = await table.host(host);
  const { code } = session.getSnapshot().shared;
  // One at a time: the host admits only a few joins at once.
  const joined: GuestSession[] = [];
  for (const guest of guests) joined.push(await table.join(code, guest));

  return { host: session, guests: joined, code };
}

/** Me hosting a game against `others` bots, played until `reached`. */
async function hostedGame(
  table: Table,
  others: Profile[],
  reached: (snapshot: SessionSnapshot) => boolean,
): Promise<HostSession> {
  const { host, guests } = await lobby(table, ME, others);
  // Only guests have to mind the host's message cap.
  table.play(host, { thinkMs: 0 });
  guests.forEach((guest) => table.play(guest));
  host.start();
  await table.stopWhen(host, reached);

  return host;
}

/** A whole game the bots play without any network, as the history on the home screen keeps it. */
function playedGame(players: NamedPlayer[], rng: Rng): GameState {
  const ctx = { now: Date.now(), rng };
  let game = createGame({
    rules: PRESETS[PresetId.Classic],
    playerIds: players.map((player) => player.id),
    hostId: players[0].id,
    seed: randomSeed(rng),
    ctx,
  });
  while (!game.finished) game = reduce(game, botMove(game, game.turn.playerId)!, ctx).state;

  return game;
}

/** Saves games into the statistics as if they were played on this phone; returns their ids. */
function saveGames(count: number, rng: Rng): string[] {
  return Array.from({ length: count }, (_, i) => {
    const players: NamedPlayer[] = [ME, ...OTHERS.slice(0, i + 1)].map((profile, n) => ({
      ...profile,
      id: `player-${n}`,
    }));
    const id = `scenario-game-${i}`;
    useStatsStore.getState().record({
      id,
      playedAt: Date.now() - (count - i) * HOUR_MS,
      myId: players[0].id,
      players,
      game: playedGame(players, rng),
    });

    return id;
  });
}

function show(session: AnySession, route: Route): Destination {
  setActiveSession(session);

  return { route };
}

const SETUPS: Record<Scenario, Setup> = {
  [Scenario.Onboarding]: async () => ({ route: Route.Onboarding }),
  [Scenario.Home]: async (_table, rng) => {
    signIn();
    saveGames(2, rng);

    return { route: Route.Home };
  },
  [Scenario.Settings]: async () => {
    signIn();

    return { route: Route.Settings };
  },
  [Scenario.HostLobby]: async (table) => {
    signIn();
    const { host } = await lobby(table, ME, OTHERS.slice(0, 3));

    return show(host, Route.HostLobby);
  },
  [Scenario.GuestLobby]: async (table) => {
    signIn();
    const [host, ...guests] = OTHERS;
    const { code } = await lobby(table, host, guests.slice(0, 1));
    const me = await table.join(code, ME, useProfileStore.getState().deviceId);

    return show(me, Route.GuestLobby);
  },
  [Scenario.GameMyTurn]: async (table) => {
    signIn();
    const host = await hostedGame(table, OTHERS.slice(0, 2), myTurnFrom(3));
    host.roll();

    return show(host, Route.Game);
  },
  [Scenario.GameWaiting]: async (table) => {
    signIn();
    const [hostProfile, ...guests] = OTHERS;
    const { host, guests: others, code } = await lobby(table, hostProfile, guests.slice(0, 1));
    const me = await table.join(code, ME, useProfileStore.getState().deviceId);
    table.play(host, { thinkMs: 0 });
    [...others, me].forEach((guest) => table.play(guest));
    host.start();
    await table.stopWhen(host, (snapshot) => {
      const game = snapshot.shared.game;

      return (
        inGame(snapshot) &&
        game!.turn.playerId === snapshot.myId &&
        game!.turn.rollsUsed === 1 &&
        currentRound(game!) >= 3
      );
    });
    await delay(SYNC_MS);

    return show(me, Route.Game);
  },
  [Scenario.GameSixPlayers]: async (table) => {
    signIn();
    const host = await hostedGame(table, OTHERS, myTurnFrom(4));

    return show(host, Route.Game);
  },
  [Scenario.Results]: async (table) => {
    signIn();
    const host = await hostedGame(
      table,
      OTHERS.slice(0, 1),
      ({ shared }) => shared.phase === SessionPhase.Finished,
    );

    return show(host, Route.Results);
  },
  [Scenario.SavedGame]: async (_table, rng) => {
    signIn();
    const [, latest] = saveGames(2, rng);

    return { route: Route.SavedGame, params: { id: latest } };
  },
  [Scenario.Training]: async (table, rng) => {
    signIn();
    const training = new TrainingSession({ profile: ME, preset: PresetId.Classic, rng });
    table.play(training, { thinkMs: 0 });
    await table.stopWhen(training, myTurnFrom(5));

    return show(training, Route.Game);
  },
};

/** Builds the scenario's state and opens its screen. Equal seeds roll equal dice. */
export async function runScenario(scenario: Scenario, seed: number): Promise<void> {
  const rng = seededRng(seed);
  const { route, params } = await SETUPS[scenario](new Table(rng), rng);
  navigate.replace(route, params);
}
