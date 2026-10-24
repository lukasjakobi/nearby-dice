import { ActionType, createGame, reduce } from '@/domain/engine';
import type { GameAction, GameState } from '@/domain/engine';
import { Link, StartingPlayer } from '@/domain/enums';
import { PlayerColor } from '@/domain/player';
import type { NamedPlayer } from '@/domain/player';
import { seededRng } from '@/domain/random';
import { DEFAULT_RULES, PRESETS, PresetId } from '@/domain/rules';
import type { Rules } from '@/domain/rules';
import type { Dice } from '@/domain/roll';
import type { SavedGame } from '@/domain/stats';
import { ConnectionStatus, Role, SessionPhase } from '@/session/types';
import type { PlayerInfo, SessionSnapshot, SharedSession } from '@/session/types';

import { botMove } from './botMove';

export const LUKAS: PlayerInfo = {
  id: 'lukas',
  name: 'Lukas',
  color: PlayerColor.Amber,
  isHost: true,
  link: Link.Connected,
};
export const ANTONIA: PlayerInfo = {
  id: 'antonia',
  name: 'Antonia',
  color: PlayerColor.Sky,
  isHost: false,
  link: Link.Connected,
};
export const JONAS: PlayerInfo = {
  id: 'jonas',
  name: 'Jonas',
  color: PlayerColor.Coral,
  isHost: false,
  link: Link.Connected,
};

function newGame(players: PlayerInfo[], rules: Rules): GameState {
  return createGame({
    rules,
    playerIds: players.map((p) => p.id),
    hostId: players.find((p) => p.isHost)!.id,
    seed: 1,
    ctx: { now: 0, rng: seededRng(1) },
  });
}

/** A new game in which the host starts. */
export function game(players: PlayerInfo[], rules: Rules = DEFAULT_RULES): GameState {
  return newGame(players, { ...rules, startingPlayer: StartingPlayer.Host });
}

/** A new game in which the host starts, carrying `preset`'s rules exactly as a session does. */
export function presetGame(players: PlayerInfo[], preset = PresetId.Classic): GameState {
  return { ...game(players, PRESETS[preset]), rules: PRESETS[preset] };
}

export function play(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(
    (s, action) => reduce(s, action, { now: 0, rng: seededRng(s.rev) }).state,
    state,
  );
}

/** A game the bots played to the end: every field written, the whole history recorded. */
export function finishedGame(players: PlayerInfo[], rules: Rules = DEFAULT_RULES): GameState {
  let state = newGame(players, rules);
  while (!state.finished) state = play(state, botMove(state, state.turn.playerId)!);

  return state;
}

/** The players as a saved game remembers them. */
export function namedPlayers(players: PlayerInfo[]): NamedPlayer[] {
  return players.map(({ id, name, color }) => ({ id, name, color }));
}

/** A finished game of `players`, as the phone of `me` saved it. */
export function savedGame(
  players: PlayerInfo[],
  me: PlayerInfo,
  overrides: Partial<SavedGame> = {},
): SavedGame {
  return {
    id: 'session-1',
    playedAt: 1_700_000_000_000,
    myId: me.id,
    players: namedPlayers(players),
    game: finishedGame(players),
    ...overrides,
  };
}

/** Forces dice for a deterministic preview. */
export function withDice(state: GameState, dice: number[]): GameState {
  return {
    ...state,
    turn: {
      ...state.turn,
      dice: dice as unknown as GameState['turn']['dice'],
      rollsUsed: 1,
      rollSeq: 1,
    },
  };
}

/** A legal roll with the requested sum, for exact-hit scoring and preview tests. */
export function diceWithSum(sum: number): Dice {
  if (!Number.isInteger(sum) || sum < 5 || sum > 30) throw new Error('Invalid dice sum');
  const dice: [number, number, number, number, number] = [1, 1, 1, 1, 1];
  let remaining = sum - 5;
  for (let i = 0; i < dice.length; i++) {
    const add = Math.min(5, remaining);
    dice[i] += add;
    remaining -= add;
  }

  return dice;
}

export function snapshot(overrides: {
  role?: Role;
  myId?: string;
  players?: PlayerInfo[];
  phase?: SessionPhase;
  game?: GameState | null;
  shared?: Partial<SharedSession>;
  connection?: SessionSnapshot['connection'];
}): SessionSnapshot {
  const players = overrides.players ?? [LUKAS, ANTONIA];

  return {
    role: overrides.role ?? Role.Host,
    myId: overrides.myId ?? LUKAS.id,
    connection: overrides.connection ?? { status: ConnectionStatus.Connected, attempt: 0 },
    ended: null,
    clockOffset: 0,
    shared: {
      sessionId: 'session',
      code: '7K4M',
      roundName: 'Lukas’ Runde',
      preset: PresetId.Classic,
      maxPlayers: 4,
      allowRejoin: true,
      phase: overrides.phase ?? SessionPhase.Playing,
      players,
      game: overrides.game === undefined ? game(players) : overrides.game,
      gameNumber: 1,
      rematch: {},
      countdownEndsAt: null,
      hostTime: 0,
      rev: 1,
      ...overrides.shared,
    },
  };
}

export { ActionType };
