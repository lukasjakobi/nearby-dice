import { Link } from '@/domain/enums';
import { PlayerColor } from '@/domain/player';
import { seededRng } from '@/domain/random';
import { PresetId } from '@/domain/rules';
import { AbortedError } from '@/lib';
import { FakeNetwork } from '@/net/fake/FakeNetwork';
import { FakeTransport } from '@/net/fake/FakeTransport';

import { GuestSession } from '../GuestSession';
import { JoinFailedError } from '../handshake';
import { HostSession } from '../HostSession';
import { RoundScanner } from '../RoundScanner';
import { MAX_RECONNECT_ATTEMPTS, TIMING } from '../timing';
import { ConnectionStatus, JoinError, JoinStep } from '../types';

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

let network: FakeNetwork;
beforeEach(() => {
  network = new FakeNetwork(10);
});

function phone(name: string) {
  const transport = new FakeTransport(network, name);

  return { name, transport, scanner: new RoundScanner(transport) };
}

type Phone = ReturnType<typeof phone>;

function host(hostPhone: Phone) {
  return settle(
    HostSession.open({
      ...hostPhone,
      profile: { name: hostPhone.name, color: PlayerColor.Amber },
      roundName: `${hostPhone.name}s Runde`,
      preset: PresetId.Classic,
      rng: seededRng(7),
    }),
  );
}

function join(
  guestPhone: Phone,
  code: string,
  extra: { onStep?: (step: JoinStep) => void; signal?: AbortSignal } = {},
) {
  return GuestSession.join({
    ...guestPhone,
    deviceId: `device-${guestPhone.name}`,
    profile: { name: guestPhone.name, color: PlayerColor.Sky },
    code,
    ...extra,
  });
}

/** Counts the transport listeners still subscribed. */
function trackListeners(transport: FakeTransport) {
  let active = 0;
  const on = transport.on.bind(transport);
  jest.spyOn(transport, 'on').mockImplementation((event, listener) => {
    active++;
    const unsubscribe = on(event, listener);

    return () => {
      active--;
      unsubscribe();
    };
  });

  return () => active;
}

async function lobby() {
  const hostPhone = phone('Lukas');
  const guestPhone = phone('Antonia');
  const hostSession = await host(hostPhone);
  const guest = await settle(join(guestPhone, hostSession.getSnapshot().shared.code));
  await run(100);
  const linked = () => network.isLinked(hostPhone.transport.id, guestPhone.transport.id);

  return { hostPhone, guestPhone, host: hostSession, guest, linked };
}

describe('joining has one deadline and never leaks its link', () => {
  test('an already cancelled join stops before discovery', async () => {
    const hostSession = await host(phone('Lukas'));
    const guestPhone = phone('Antonia');
    const discover = jest.spyOn(guestPhone.transport, 'startDiscovery');
    const controller = new AbortController();
    controller.abort();

    await expect(
      settle(
        join(guestPhone, hostSession.getSnapshot().shared.code, { signal: controller.signal }),
        100,
      ),
    ).rejects.toBeInstanceOf(AbortedError);
    expect(discover).not.toHaveBeenCalled();
  });

  test('cancelling while connecting closes the new link', async () => {
    const hostPhone = phone('Lukas');
    const guestPhone = phone('Antonia');
    const hostSession = await host(hostPhone);
    network.delayConnects(1000);
    const controller = new AbortController();
    const joining = join(guestPhone, hostSession.getSnapshot().shared.code, {
      signal: controller.signal,
      onStep: (step) => {
        if (step === JoinStep.Secure) setTimeout(() => controller.abort(), 500);
      },
    });

    await expect(settle(joining, 600)).rejects.toBeInstanceOf(AbortedError);
    await run(2000);
    expect(network.isLinked(hostPhone.transport.id, guestPhone.transport.id)).toBe(false);
  });

  test('a connect that outlasts the deadline fails the join and leaves no link', async () => {
    const hostPhone = phone('Lukas');
    const guestPhone = phone('Antonia');
    const hostSession = await host(hostPhone);
    network.delayConnects(60_000);
    const started = Date.now();

    await expect(
      settle(join(guestPhone, hostSession.getSnapshot().shared.code), TIMING.joinTimeout + 100),
    ).rejects.toEqual(new JoinFailedError(JoinError.NotFound));
    expect(Date.now() - started).toBeLessThanOrEqual(TIMING.joinTimeout + 100);
    await run(60_000);
    expect(network.isLinked(hostPhone.transport.id, guestPhone.transport.id)).toBe(false);
  });

  test('a HELLO that cannot be sent closes the link and releases every listener', async () => {
    const hostPhone = phone('Lukas');
    const guestPhone = phone('Antonia');
    const hostSession = await host(hostPhone);
    const listeners = trackListeners(guestPhone.transport);
    jest.spyOn(guestPhone.transport, 'send').mockRejectedValueOnce(new Error('send failed'));

    await expect(settle(join(guestPhone, hostSession.getSnapshot().shared.code))).rejects.toEqual(
      new JoinFailedError(JoinError.NotFound),
    );
    await run(100);
    expect(network.isLinked(hostPhone.transport.id, guestPhone.transport.id)).toBe(false);
    expect(listeners()).toBe(0);
  });

  test('a host that never answers fails the join at the deadline and closes the link', async () => {
    const hostPhone = phone('Lukas');
    const guestPhone = phone('Antonia');
    const hostSession = await host(hostPhone);
    jest.spyOn(guestPhone.transport, 'send').mockResolvedValueOnce(undefined); // HELLO is lost
    const started = Date.now();

    await expect(
      settle(join(guestPhone, hostSession.getSnapshot().shared.code), TIMING.joinTimeout + 100),
    ).rejects.toEqual(new JoinFailedError(JoinError.NotFound));
    expect(Date.now() - started).toBeLessThanOrEqual(TIMING.joinTimeout + 100);
    expect(network.isLinked(hostPhone.transport.id, guestPhone.transport.id)).toBe(false);
  });

  test('a stalled connect cannot hold a reconnect attempt past its deadline', async () => {
    const { guestPhone, guest, linked } = await lobby();
    network.delayConnects(120_000);
    network.cut(guestPhone.transport);

    const delays = TIMING.reconnectDelays.reduce<number>((sum, ms) => sum + ms, 0);
    await run(delays + MAX_RECONNECT_ATTEMPTS * TIMING.reconnectAttemptTimeout + 500);
    expect(guest.getSnapshot().connection).toEqual({
      status: ConnectionStatus.Failed,
      attempt: MAX_RECONNECT_ATTEMPTS,
    });
    await run(120_000);
    expect(linked()).toBe(false);
  });
});

describe('failed sends start recovery', () => {
  test('a guest command that cannot be sent reconnects and resyncs from the host', async () => {
    const { host: hostSession, guestPhone, guest, linked } = await lobby();
    hostSession.start();
    await run(TIMING.countdown + 100);
    jest.spyOn(guestPhone.transport, 'send').mockRejectedValueOnce(new Error('send failed'));

    guest.toggleHold(0); // shown right away, but never reaches the host
    expect(guest.getSnapshot().shared.game!.turn.held[0]).toBe(true);
    await run(0);
    expect(guest.getSnapshot().connection.status).toBe(ConnectionStatus.Reconnecting);
    expect(linked()).toBe(false);

    await run(1000);
    expect(guest.getSnapshot().connection.status).toBe(ConnectionStatus.Connected);
    expect(linked()).toBe(true);
    expect(guest.getSnapshot().shared.game).toEqual(hostSession.getSnapshot().shared.game);
  });

  test('a host broadcast that cannot be sent marks the guest lost until it resyncs', async () => {
    const { host: hostSession, hostPhone, guest, linked } = await lobby();
    const guestId = guest.getSnapshot().myId;
    const linkOf = () =>
      hostSession.getSnapshot().shared.players.find((p) => p.id === guestId)?.link;
    jest.spyOn(hostPhone.transport, 'send').mockRejectedValueOnce(new Error('send failed'));

    hostSession.setPreset(PresetId.Yatzy); // the broadcast to the guest fails
    await run(0);
    expect(linkOf()).toBe(Link.Lost);
    expect(linked()).toBe(false);

    await run(1000);
    expect(linkOf()).toBe(Link.Connected);
    expect(linked()).toBe(true);
    expect(guest.getSnapshot().connection.status).toBe(ConnectionStatus.Connected);
    expect(guest.getSnapshot().shared.preset).toBe(PresetId.Yatzy);
  });
});
