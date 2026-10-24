import { Category, Link } from '@/domain/enums';
import { PlayerColor } from '@/domain/player';
import { seededRng } from '@/domain/random';
import { PRESETS, PresetId } from '@/domain/rules';
import { turnsPerPlayer } from '@/domain/sheet';
import { FakeNetwork } from '@/net/fake/FakeNetwork';
import { BotPlayer } from '@/test/BotPlayer';
import { FakeTransport } from '@/net/fake/FakeTransport';
import { PermissionStatus, RadioState } from '@/net/transport';

import { GuestSession } from '../GuestSession';
import { JoinFailedError } from '../handshake';
import { HostOpenError, HostSession } from '../HostSession';
import { RoundScanner } from '../RoundScanner';
import {
  ConnectionStatus,
  EndReason,
  HostError,
  JoinError,
  JoinStep,
  RematchVote,
  SessionPhase,
} from '../types';

jest.useFakeTimers();

const run = (ms: number) => jest.advanceTimersByTimeAsync(ms);

/** Starts a promise and advances fake time until it settles. */
async function settle<T>(promise: Promise<T>, maxMs = 30_000): Promise<T> {
  let done = false;
  const outcome = promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  void outcome.then(() => (done = true));
  for (let t = 0; t < maxMs && !done; t += 50) await run(50);
  const result = await outcome;
  if (!result.ok) throw result.error;

  return result.value;
}

class Phone {
  readonly transport: FakeTransport;
  readonly scanner: RoundScanner;
  constructor(
    network: FakeNetwork,
    readonly name: string,
  ) {
    this.transport = new FakeTransport(network, name);
    this.scanner = new RoundScanner(this.transport);
  }

  host(preset = PresetId.Classic, maxPlayers = 4) {
    return settle(
      HostSession.open({
        transport: this.transport,
        scanner: this.scanner,
        profile: { name: this.name, color: PlayerColor.Amber },
        roundName: `${this.name}s Runde`,
        preset,
        maxPlayers,
        rng: seededRng(7),
      }),
    );
  }

  join(code: string, onStep?: (step: JoinStep) => void) {
    return settle(
      GuestSession.join({
        transport: this.transport,
        scanner: this.scanner,
        deviceId: `device-${this.name}`,
        profile: { name: this.name, color: PlayerColor.Sky },
        code,
        onStep,
      }),
    );
  }
}

let network: FakeNetwork;
beforeEach(() => {
  network = new FakeNetwork(10);
});

async function lobbyWith(guestNames: string[], preset?: PresetId, maxPlayers?: number) {
  const host = await new Phone(network, 'Lukas').host(preset, maxPlayers);
  const code = host.getSnapshot().shared.code;
  const guests: GuestSession[] = [];
  for (const name of guestNames) guests.push(await new Phone(network, name).join(code));
  await run(100);

  return { host, guests, code };
}

describe('lobby', () => {
  test('guests join by code and everyone sees the same players', async () => {
    const steps: JoinStep[] = [];
    const host = await new Phone(network, 'Lukas').host();
    const code = host.getSnapshot().shared.code;
    const antonia = await new Phone(network, 'Antonia').join(code, (s) => steps.push(s));
    const jonas = await new Phone(network, 'Jonas').join(code);
    await run(100);

    expect(steps).toEqual([JoinStep.Search, JoinStep.Secure, JoinStep.Join]);
    const names = (s: { getSnapshot: typeof host.getSnapshot }) =>
      s.getSnapshot().shared.players.map((p) => p.name);
    expect(names(host)).toEqual(['Lukas', 'Antonia', 'Jonas']);
    expect(names(antonia)).toEqual(names(host));
    expect(names(jonas)).toEqual(names(host));
  });

  test('an unknown code is not found', async () => {
    await new Phone(network, 'Lukas').host();
    await expect(new Phone(network, 'Antonia').join('ZZZZ')).rejects.toEqual(
      new JoinFailedError(JoinError.NotFound),
    );
  });

  test('the host switches the mode for everyone and the game starts in it', async () => {
    const { host, guests } = await lobbyWith(['Antonia']);
    host.setPreset(PresetId.Yatzy);
    await run(100);
    expect(guests[0].getSnapshot().shared.preset).toBe(PresetId.Yatzy);

    host.start();
    await run(100);
    expect(guests[0].getSnapshot().shared.game!.rules).toEqual(PRESETS[PresetId.Yatzy]);
    host.setPreset(PresetId.Blitz); // ignored once the game is under way
    expect(host.getSnapshot().shared.preset).toBe(PresetId.Yatzy);
  });

  test('a full round rejects', async () => {
    const { code } = await lobbyWith(['Antonia'], PresetId.Classic, 2);
    await expect(new Phone(network, 'Jonas').join(code)).rejects.toMatchObject({
      reason: JoinError.Full,
    });
  });

  test('a kicked player is told and cannot come back', async () => {
    const { host, guests, code } = await lobbyWith(['Antonia']);
    const antoniaId = guests[0].getSnapshot().myId;
    host.kick(antoniaId);
    await run(500);
    expect(guests[0].getSnapshot().ended).toBe(EndReason.Kicked);
    expect(host.getSnapshot().shared.players).toHaveLength(1);

    // Same device (same device id) trying again with the code.
    await expect(new Phone(network, 'Antonia').join(code)).rejects.toMatchObject({
      reason: JoinError.Removed,
    });
  });

  test('closing the lobby ends the session for guests', async () => {
    const { host, guests } = await lobbyWith(['Antonia']);
    host.closeLobby();
    await run(500);
    expect(guests[0].getSnapshot().ended).toBe(EndReason.LobbyClosed);
    expect(host.getSnapshot().ended).toBe(EndReason.LobbyClosed);
  });

  test('nobody new can join after the start', async () => {
    const { host, code } = await lobbyWith(['Antonia']);
    host.start();
    await run(100);
    await expect(new Phone(network, 'Jonas').join(code)).rejects.toMatchObject({
      reason: JoinError.Started,
    });
  });

  test('radio problems are reported before anything else', async () => {
    const phone = new Phone(network, 'Lukas');
    phone.transport.radio = RadioState.BluetoothOff;
    await expect(phone.host()).rejects.toEqual(new HostOpenError(HostError.BluetoothOff));
    phone.transport.radio = RadioState.LocationOff;
    await expect(phone.host()).rejects.toEqual(new HostOpenError(HostError.LocationOff));
    phone.transport.radio = RadioState.Ready;
    phone.transport.permission = PermissionStatus.Blocked;
    await expect(phone.host()).rejects.toEqual(new HostOpenError(HostError.PermissionMissing));
  });

  test.each([
    [RadioState.BluetoothOff, JoinError.BluetoothOff],
    [RadioState.LocationOff, JoinError.LocationOff],
  ])('joining stops before discovery when the radio is %s', async (radio, reason) => {
    const phone = new Phone(network, 'Antonia');
    phone.transport.radio = radio;
    const discover = jest.spyOn(phone.transport, 'startDiscovery');
    await expect(phone.join('ABCD')).rejects.toEqual(new JoinFailedError(reason));
    expect(discover).not.toHaveBeenCalled();
  });
});

describe('session teardown', () => {
  test('host close delivers the farewell and closes admitted and pending peers', async () => {
    const hostPhone = new Phone(network, 'Lukas');
    const guestPhone = new Phone(network, 'Antonia');
    const host = await hostPhone.host();
    const guest = await guestPhone.join(host.getSnapshot().shared.code);
    await run(100);

    host.closeLobby();
    await run(500);

    expect(guest.getSnapshot().ended).toBe(EndReason.LobbyClosed);
    expect(network.isLinked(hostPhone.transport.id, guestPhone.transport.id)).toBe(false);
  });

  test('direct host disposal closes every owned link, including an unadmitted peer', async () => {
    const hostPhone = new Phone(network, 'Lukas');
    const guestPhone = new Phone(network, 'Antonia');
    const host = await hostPhone.host();
    await settle(guestPhone.transport.connect(hostPhone.transport.id));
    await run(50);
    host.dispose();
    host.dispose();
    await run(50);
    expect(network.isLinked(hostPhone.transport.id, guestPhone.transport.id)).toBe(false);
    expect(host.getSnapshot().ended).toBe(null);
  });

  test('guest leave sends Leave before the farewell grace closes its link', async () => {
    const hostPhone = new Phone(network, 'Lukas');
    const guestPhone = new Phone(network, 'Antonia');
    const host = await hostPhone.host();
    const guest = await guestPhone.join(host.getSnapshot().shared.code);
    await run(100);

    guest.leave();
    expect(guest.getSnapshot().ended).toBe(EndReason.Left);
    expect(network.isLinked(hostPhone.transport.id, guestPhone.transport.id)).toBe(true);
    await run(500);
    expect(network.isLinked(hostPhone.transport.id, guestPhone.transport.id)).toBe(false);
    expect(host.getSnapshot().shared.players).toHaveLength(1);
  });

  test('direct guest disposal closes its link and repeated disposal is harmless', async () => {
    const hostPhone = new Phone(network, 'Lukas');
    const guestPhone = new Phone(network, 'Antonia');
    const host = await hostPhone.host();
    const guest = await guestPhone.join(host.getSnapshot().shared.code);
    await run(100);

    guest.dispose();
    guest.dispose();
    await run(50);
    expect(network.isLinked(hostPhone.transport.id, guestPhone.transport.id)).toBe(false);
    expect(guest.getSnapshot().ended).toBe(null);
  });
});

describe('game', () => {
  test.each([PresetId.Blitz, PresetId.ClassicXl, PresetId.LuckyNumber])(
    '%s: every phone finishes with identical sheets and history',
    async (preset) => {
      const rules = PRESETS[preset];
      const { host, guests } = await lobbyWith(['Antonia', 'Jonas'], preset);
      const bots = [host, ...guests].map((s) => new BotPlayer(s, { thinkMs: 50 }));
      host.start();
      await run(3600);
      expect(host.getSnapshot().shared.phase).toBe(SessionPhase.Playing);

      for (
        let t = 0;
        t < 120_000 && host.getSnapshot().shared.phase !== SessionPhase.Finished;
        t += 200
      ) {
        await run(200);
      }

      await run(200);
      const hostGame = host.getSnapshot().shared.game!;
      expect(hostGame.finished).toBe(true);
      expect(hostGame.history).toHaveLength(3 * turnsPerPlayer(rules));
      expect(hostGame.players.every((player) => player.turnsTaken === turnsPerPlayer(rules))).toBe(
        true,
      );
      for (const guest of guests) {
        expect(guest.getSnapshot().shared.phase).toBe(SessionPhase.Finished);
        expect(guest.getSnapshot().shared.game).toEqual(hostGame);
      }

      bots.forEach((b) => b.stop());
    },
  );

  test('rematch keeps the yes-voters and removes the others', async () => {
    const { host, guests } = await lobbyWith(['Antonia', 'Jonas'], PresetId.Blitz);
    const bots = [
      new BotPlayer(host, { thinkMs: 50 }),
      new BotPlayer(guests[0], { thinkMs: 50, rematch: RematchVote.Yes }),
      new BotPlayer(guests[1], { thinkMs: 50, rematch: RematchVote.No }),
    ];
    host.start();
    for (
      let t = 0;
      t < 120_000 && host.getSnapshot().shared.phase !== SessionPhase.Finished;
      t += 200
    ) {
      await run(200);
    }

    await run(2000);
    host.startRematch();
    await run(500);
    expect(host.getSnapshot().shared.players.map((p) => p.name)).toEqual(['Lukas', 'Antonia']);
    expect(host.getSnapshot().shared.gameNumber).toBe(2);
    expect(guests[1].getSnapshot().ended).toBe(EndReason.GameEnded);
    bots.forEach((b) => b.stop());
  });

  test('rematch starts by itself once everyone has voted, the host included', async () => {
    const { host, guests } = await lobbyWith(['Antonia', 'Jonas'], PresetId.Blitz);
    const bots = [
      new BotPlayer(host, { thinkMs: 50, rematch: RematchVote.Yes }),
      new BotPlayer(guests[0], { thinkMs: 50, rematch: RematchVote.Yes }),
      new BotPlayer(guests[1], { thinkMs: 50, rematch: null }),
    ];
    host.start();
    for (
      let t = 0;
      t < 120_000 && host.getSnapshot().shared.phase !== SessionPhase.Finished;
      t += 200
    ) {
      await run(200);
    }

    await run(2000);
    // Jonas has not decided yet: nobody starts.
    expect(host.getSnapshot().shared.phase).toBe(SessionPhase.Finished);
    expect(host.getSnapshot().shared.rematch).toMatchObject({
      [host.getSnapshot().myId]: RematchVote.Yes,
    });

    guests[1].voteRematch(RematchVote.No);
    await run(500);
    expect(host.getSnapshot().shared.gameNumber).toBe(2);
    expect(host.getSnapshot().shared.players.map((p) => p.name)).toEqual(['Lukas', 'Antonia']);
    bots.forEach((b) => b.stop());
  });

  test("a new mode on the results screen undoes the guests' yes and applies to the rematch", async () => {
    const { host, guests } = await lobbyWith(['Antonia', 'Jonas'], PresetId.Blitz);
    const bots = [
      new BotPlayer(host, { thinkMs: 50, rematch: RematchVote.Yes }),
      new BotPlayer(guests[0], { thinkMs: 50, rematch: RematchVote.Yes }),
      new BotPlayer(guests[1], { thinkMs: 50, rematch: null }),
    ];
    host.start();
    for (
      let t = 0;
      t < 120_000 && host.getSnapshot().shared.phase !== SessionPhase.Finished;
      t += 200
    ) {
      await run(200);
    }

    await run(2000);
    bots.forEach((b) => b.stop());
    const [hostId, antoniaId, jonasId] = [host, ...guests].map((s) => s.getSnapshot().myId);
    expect(host.getSnapshot().shared.rematch[antoniaId]).toBe(RematchVote.Yes);

    host.setPreset(PresetId.Yatzy);
    await run(100);
    expect(guests[0].getSnapshot().shared.preset).toBe(PresetId.Yatzy);
    expect(host.getSnapshot().shared.rematch).toEqual({
      [hostId]: RematchVote.Yes,
      [antoniaId]: RematchVote.Pending,
      [jonasId]: RematchVote.Pending,
    });

    guests[0].voteRematch(RematchVote.Yes);
    guests[1].voteRematch(RematchVote.No);
    await run(500);
    expect(host.getSnapshot().shared.gameNumber).toBe(2);
    expect(guests[0].getSnapshot().shared.game!.rules).toEqual(PRESETS[PresetId.Yatzy]);
  });

  test("every phone sees the active player's selection before it is entered", async () => {
    const { host, guests } = await lobbyWith(['Antonia', 'Jonas']);
    host.start();
    await run(3600);
    const phones = [host, ...guests];
    const turnId = host.getSnapshot().shared.game!.turn.playerId;
    const active = phones.find((p) => p.getSnapshot().myId === turnId)!;
    const focusOn = () => phones.map((p) => p.getSnapshot().shared.game!.turn.focus);

    active.roll();
    await run(200);
    active.focus({ category: Category.Chance, sheet: 0 });
    await run(200);
    expect(focusOn()).toEqual(phones.map(() => ({ category: Category.Chance, sheet: 0 })));

    active.roll();
    await run(200);
    expect(focusOn()).toEqual(phones.map(() => null));
  });

  test('guests cannot act out of turn', async () => {
    const { host, guests } = await lobbyWith(['Antonia']);
    host.start();
    await run(3600);
    const before = host.getSnapshot().shared.game!;
    const notMe = guests.find((g) => g.getSnapshot().myId !== before.turn.playerId);
    notMe?.roll();
    await run(200);
    expect(host.getSnapshot().shared.game!.turn.rollsUsed).toBe(before.turn.rollsUsed);
  });
});

describe('connection loss', () => {
  test('a lost guest is marked and reconnects into the same seat', async () => {
    const { host, guests } = await lobbyWith(['Antonia']);
    host.start();
    await run(3600);
    const antonia = guests[0];
    const antoniaId = antonia.getSnapshot().myId;
    const antoniaTransport = (antonia as unknown as { options: { transport: FakeTransport } })
      .options.transport;

    network.makeUnreachable(antoniaTransport, 1500);
    await run(100);
    expect(host.getSnapshot().shared.players.find((p) => p.id === antoniaId)?.link).toBe(Link.Lost);
    expect(antonia.getSnapshot().connection.status).toBe(ConnectionStatus.Reconnecting);

    await run(6000);
    expect(antonia.getSnapshot().connection.status).toBe(ConnectionStatus.Connected);
    expect(antonia.getSnapshot().myId).toBe(antoniaId);
    expect(host.getSnapshot().shared.players.find((p) => p.id === antoniaId)?.link).toBe(
      Link.Connected,
    );
  });

  test('after three failed attempts the guest gives up', async () => {
    const { host, guests } = await lobbyWith(['Antonia']);
    host.start();
    await run(3600);
    const antoniaTransport = (guests[0] as unknown as { options: { transport: FakeTransport } })
      .options.transport;
    network.makeUnreachable(antoniaTransport, 120_000);
    await run(60_000);
    expect(guests[0].getSnapshot().connection).toEqual({
      status: ConnectionStatus.Failed,
      attempt: 3,
    });
  });
});

describe('host open', () => {
  test('a host whose advertising fails releases its listeners and timers', async () => {
    const phone = new Phone(network, 'Lukas');
    const transport = phone.transport;
    const released = jest.fn();
    const on = transport.on.bind(transport);
    const listen = jest.spyOn(transport, 'on').mockImplementation((event, listener) => {
      const unsubscribe = on(event, listener);

      return () => {
        released();
        unsubscribe();
      };
    });
    jest.spyOn(transport, 'startAdvertising').mockRejectedValue(new Error('advertising failed'));

    jest.clearAllTimers();
    await expect(phone.host()).rejects.toThrow('advertising failed');

    expect(listen).toHaveBeenCalled();
    expect(released).toHaveBeenCalledTimes(listen.mock.calls.length);
    expect(jest.getTimerCount()).toBe(0);
  });
});
