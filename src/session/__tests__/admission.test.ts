import { Link } from '@/domain/enums';
import { PlayerColor } from '@/domain/player';
import { seededRng } from '@/domain/random';
import { PresetId } from '@/domain/rules';
import { FakeNetwork } from '@/net/fake/FakeNetwork';
import { FakeTransport } from '@/net/fake/FakeTransport';
import { TransportEvent } from '@/net/transport';
import { BotPlayer } from '@/dev';

import { GuestSession } from '../GuestSession';
import { HostSession } from '../HostSession';
import { MessageType, RejectReason, decode, encode } from '../protocol';
import type { Message, MessageOf } from '../protocol';
import { RoundScanner } from '../RoundScanner';
import { MAX_MESSAGES_PER_WINDOW, MAX_PENDING_ADMISSIONS, TIMING } from '../timing';
import { RematchVote, SessionPhase } from '../types';

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

/** Counts the State messages a phone receives. */
function countStates(transport: FakeTransport): () => number {
  let states = 0;
  transport.on(TransportEvent.Data, ({ data }) => {
    if (decode(data)?.type === MessageType.State) states++;
  });

  return () => states;
}

/** A hand-driven link that speaks the protocol directly, like a modified client. */
class RawPeer {
  readonly transport: FakeTransport;
  readonly received: Message[] = [];
  private authToken = '';

  constructor(
    private readonly network: FakeNetwork,
    private readonly host: FakeTransport,
  ) {
    this.transport = new FakeTransport(network, 'raw');
    this.transport.on(TransportEvent.Data, ({ data }) => {
      const message = decode(data);
      if (message) this.received.push(message);
    });
  }

  async connect(): Promise<void> {
    ({ authToken: this.authToken } = await settle(this.transport.connect(this.host.id)));
  }

  hello(deviceId: string, rejoinToken: string | null = null): void {
    this.send({
      type: MessageType.Hello,
      deviceId,
      profile: { name: 'Mallory', color: PlayerColor.Coral },
      authToken: this.authToken,
      rejoinToken,
    });
  }

  send(message: Message): void {
    void this.transport.send(this.host.id, encode(message));
  }

  get linked(): boolean {
    return this.network.isLinked(this.transport.id, this.host.id);
  }

  get welcome(): MessageOf<MessageType.Welcome> | undefined {
    return this.received.find((m) => m.type === MessageType.Welcome);
  }

  get rejects(): RejectReason[] {
    return this.received.flatMap((m) => (m.type === MessageType.Reject ? [m.reason] : []));
  }
}

let network: FakeNetwork;
beforeEach(() => {
  network = new FakeNetwork(10);
});

async function lobbyWith(guestNames: string[]) {
  const hostTransport = new FakeTransport(network, 'Lukas');
  const host = await settle(
    HostSession.open({
      transport: hostTransport,
      scanner: new RoundScanner(hostTransport),
      profile: { name: 'Lukas', color: PlayerColor.Amber },
      roundName: 'Lukas Runde',
      preset: PresetId.Blitz,
      rng: seededRng(7),
    }),
  );
  const code = host.getSnapshot().shared.code;
  const join = async (name: string) => {
    const transport = new FakeTransport(network, name);
    const guest = await settle(
      GuestSession.join({
        transport,
        scanner: new RoundScanner(transport),
        deviceId: `device-${name}`,
        profile: { name, color: PlayerColor.Sky },
        code,
      }),
    );

    return { guest, transport };
  };

  const guests = [];
  for (const name of guestNames) guests.push(await join(name));
  await run(100);
  const linkOf = (playerId: string) =>
    host.getSnapshot().shared.players.find((p) => p.id === playerId)?.link;
  const rawPeer = async () => {
    const peer = new RawPeer(network, hostTransport);
    await peer.connect();

    return peer;
  };

  return { host, hostTransport, guests, join, linkOf, rawPeer };
}

describe('returning to a seat', () => {
  test.each([null, 'wrong-token'])(
    'a device ID with rejoin token %p does not take over a connected lobby seat',
    async (rejoinToken) => {
      const { host, hostTransport, guests, linkOf, rawPeer } = await lobbyWith(['Antonia']);
      const antonia = guests[0];
      const antoniaId = antonia.guest.getSnapshot().myId;

      const mallory = await rawPeer();
      mallory.hello('device-Antonia', rejoinToken);
      await run(500);

      expect(mallory.welcome?.playerId).not.toBe(antoniaId);
      expect(mallory.welcome?.rejoinToken).not.toBe(antonia.guest.rejoinToken);
      expect(host.getSnapshot().shared.players).toHaveLength(3);
      expect(linkOf(antoniaId)).toBe(Link.Connected);
      expect(network.isLinked(antonia.transport.id, hostTransport.id)).toBe(true);
      expect(antonia.guest.getSnapshot().myId).toBe(antoniaId);
      expect(antonia.guest.getSnapshot().ended).toBeNull();
    },
  );

  test.each([null, 'wrong-token'])(
    'a device ID with rejoin token %p cannot enter a running game',
    async (rejoinToken) => {
      const { host, hostTransport, guests, linkOf, rawPeer } = await lobbyWith(['Antonia']);
      host.start();
      await run(3600);
      const antonia = guests[0];
      const antoniaId = antonia.guest.getSnapshot().myId;

      const mallory = await rawPeer();
      mallory.hello('device-Antonia', rejoinToken);
      await run(500);

      expect(mallory.rejects).toEqual([RejectReason.Started]);
      expect(mallory.welcome).toBeUndefined();
      expect(mallory.linked).toBe(false);
      expect(linkOf(antoniaId)).toBe(Link.Connected);
      expect(network.isLinked(antonia.transport.id, hostTransport.id)).toBe(true);
    },
  );

  test('the rejoin token returns its own seat and replaces the old link', async () => {
    const { host, linkOf, rawPeer } = await lobbyWith(['Antonia']);
    const first = await rawPeer();
    first.hello('device-raw');
    await run(100);
    const { playerId, rejoinToken } = first.welcome!;

    const otherDevice = await rawPeer();
    otherDevice.hello('device-other', rejoinToken);
    const second = await rawPeer();
    second.hello('device-raw', rejoinToken);
    await run(500);

    expect(otherDevice.welcome?.playerId).not.toBe(playerId);
    expect(second.welcome?.playerId).toBe(playerId);
    expect(first.linked).toBe(false);
    expect(second.linked).toBe(true);
    expect(linkOf(playerId)).toBe(Link.Connected);
    expect(host.getSnapshot().shared.players).toHaveLength(4);
  });

  test('a device that lost its lobby link without a token joins anew in place of its old seat', async () => {
    const { host, guests, join, linkOf } = await lobbyWith(['Antonia']);
    const old = guests[0];
    const oldId = old.guest.getSnapshot().myId;
    network.makeUnreachable(old.transport, 60_000);
    old.guest.dispose(); // the app was closed
    await run(100);
    expect(linkOf(oldId)).toBe(Link.Lost);

    const fresh = await join('Antonia');
    await run(100);

    expect(fresh.guest.getSnapshot().myId).not.toBe(oldId);
    expect(host.getSnapshot().shared.players.map((p) => [p.name, p.link])).toEqual([
      ['Lukas', Link.Connected],
      ['Antonia', Link.Connected],
    ]);
  });
});

describe('admitting a connection once', () => {
  test.each(['device-raw', 'device-second'])(
    'a repeated HELLO (%s) takes no second seat and closes the link',
    async (secondDevice) => {
      const { host, linkOf, rawPeer } = await lobbyWith(['Antonia']);
      const raw = await rawPeer();
      raw.hello('device-raw');
      await run(100);
      raw.hello(secondDevice);
      await run(500);

      const { playerId } = raw.welcome!;
      expect(raw.received.filter((m) => m.type === MessageType.Welcome)).toHaveLength(1);
      expect(host.getSnapshot().shared.players).toHaveLength(3);
      expect(raw.linked).toBe(false);
      expect(linkOf(playerId)).toBe(Link.Lost);

      // The seat is free for its token again.
      const back = await rawPeer();
      back.hello('device-raw', raw.welcome!.rejoinToken);
      await run(100);
      expect(back.welcome?.playerId).toBe(playerId);
      expect(linkOf(playerId)).toBe(Link.Connected);
    },
  );

  test('a rejected connection cannot try again with another device ID', async () => {
    const { host, guests, rawPeer } = await lobbyWith(['Antonia']);
    host.kick(guests[0].guest.getSnapshot().myId);
    await run(500);

    const raw = await rawPeer();
    raw.hello('device-Antonia');
    await run(50); // within the farewell grace
    raw.hello('device-new');
    await run(500);

    expect(raw.rejects).toEqual([RejectReason.Removed]);
    expect(raw.welcome).toBeUndefined();
    expect(raw.linked).toBe(false);
    expect(host.getSnapshot().shared.players).toHaveLength(1);
  });
});

describe('admission limits', () => {
  test('a connection without HELLO is closed after the deadline', async () => {
    const { rawPeer } = await lobbyWith([]);
    const silent = await rawPeer();
    await run(TIMING.helloTimeout - 200);
    expect(silent.linked).toBe(true);
    await run(400);
    expect(silent.linked).toBe(false);
  });

  test('pending admissions are bounded', async () => {
    const { rawPeer } = await lobbyWith([]);
    const pending = [];
    for (let i = 0; i < MAX_PENDING_ADMISSIONS; i++) pending.push(await rawPeer());
    const extra = await rawPeer();
    await run(50);
    expect(pending.every((peer) => peer.linked)).toBe(true);
    expect(extra.linked).toBe(false);

    // Admitted connections make room again.
    pending[0].hello('device-raw');
    await run(100);
    expect(pending[0].welcome).toBeDefined();
    const next = await rawPeer();
    await run(50);
    expect(next.linked).toBe(true);
  });

  test('an invalid intent resyncs only its sender', async () => {
    const { host, guests } = await lobbyWith(['Antonia', 'Jonas']);
    host.start();
    await run(3600);
    const turnId = host.getSnapshot().shared.game!.turn.playerId;
    const sender = guests.find(({ guest }) => guest.getSnapshot().myId !== turnId)!;
    const other = guests.find((g) => g !== sender)!;
    const senderStates = countStates(sender.transport);
    const otherStates = countStates(other.transport);
    const rev = host.getSnapshot().shared.rev;

    sender.guest.roll(); // not this guest's turn
    await run(200);

    expect(host.getSnapshot().shared.rev).toBe(rev);
    expect(senderStates()).toBe(1);
    expect(otherStates()).toBe(0);
  });

  test('a repeated rematch vote is not broadcast again', async () => {
    const { host, guests } = await lobbyWith(['Antonia', 'Jonas']);
    const bots = [host, ...guests.map((g) => g.guest)].map(
      (session) => new BotPlayer(session, { thinkMs: 50, rematch: null }),
    );
    host.start();
    for (let t = 0; t < 120_000 && host.getSnapshot().shared.phase !== SessionPhase.Finished;) {
      await run(200);
      t += 200;
    }

    bots.forEach((bot) => bot.stop());
    await run(200);
    expect(host.getSnapshot().shared.phase).toBe(SessionPhase.Finished);
    const states = countStates(guests[1].transport);

    guests[0].guest.voteRematch(RematchVote.No);
    await run(200);
    guests[0].guest.voteRematch(RematchVote.No);
    await run(200);

    expect(states()).toBe(1);
  });

  test('a peer that floods messages is disconnected', async () => {
    const { linkOf, rawPeer } = await lobbyWith([]);
    const raw = await rawPeer();
    raw.hello('device-raw');
    await run(TIMING.rateWindow);
    const { playerId } = raw.welcome!;

    for (let i = 0; i < MAX_MESSAGES_PER_WINDOW; i++) raw.send({ type: MessageType.Ping, at: i });
    await run(TIMING.rateWindow);
    expect(raw.linked).toBe(true);
    expect(linkOf(playerId)).toBe(Link.Connected);

    for (let i = 0; i <= MAX_MESSAGES_PER_WINDOW; i++) raw.send({ type: MessageType.Ping, at: i });
    await run(100);
    expect(raw.linked).toBe(false);
    expect(linkOf(playerId)).toBe(Link.Lost);
  });
});

describe('advertised occupancy', () => {
  test('follows joins, leaves and kicks', async () => {
    const { host, hostTransport, guests, join } = await lobbyWith(['Antonia']);
    const advertised = () => network.advertisementOf(hostTransport)?.players;
    expect(advertised()).toBe(2);

    host.kick(guests[0].guest.getSnapshot().myId);
    await run(500);
    expect(advertised()).toBe(1);

    const jonas = await join('Jonas');
    await run(100);
    expect(advertised()).toBe(2);

    jonas.guest.leave();
    await run(500);
    expect(advertised()).toBe(1);
  });
});
