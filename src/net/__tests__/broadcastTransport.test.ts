import { PlayerColor } from '@/domain/player';
import { AbortedError } from '@/lib/async';

import { BroadcastTransport } from '../broadcast/BroadcastTransport';
import { ConnectFailedError, PermissionStatus, RadioState, TransportEvent } from '../transport';
import type { TransportEvents } from '../transport';

/** Browser tabs of one origin: every other channel of the same name gets each message, later. */
class FakeBroadcastChannel {
  private static readonly open = new Set<FakeBroadcastChannel>();
  onmessage: ((event: { data: unknown }) => void) | null = null;

  constructor(readonly name: string) {
    FakeBroadcastChannel.open.add(this);
  }

  postMessage(data: unknown): void {
    for (const channel of FakeBroadcastChannel.open) {
      if (channel === this || channel.name !== this.name) continue;
      const copy = structuredClone(data);
      setTimeout(() => channel.onmessage?.({ data: copy }), 1);
    }
  }

  static closeAll(): void {
    FakeBroadcastChannel.open.clear();
  }
}

jest.useFakeTimers();
const settle = () => jest.advanceTimersByTimeAsync(10);

const AD = {
  code: '7K4M',
  roundName: 'Antonias Runde',
  hostName: 'Antonia',
  hostColor: PlayerColor.Sky,
  players: 1,
  maxPlayers: 6,
};

beforeAll(() => {
  globalThis.BroadcastChannel = FakeBroadcastChannel as unknown as typeof BroadcastChannel;
});
afterEach(() => FakeBroadcastChannel.closeAll());

function record<E extends TransportEvent>(transport: BroadcastTransport, event: E) {
  const seen: TransportEvents[E][] = [];
  transport.on(event, (payload) => seen.push(payload));

  return seen;
}

/** A host advertising `AD` and a guest connected to it. */
async function connected() {
  const host = new BroadcastTransport();
  const guest = new BroadcastTransport();
  await host.startAdvertising(AD);
  const connecting = guest.connect(host.id);
  await settle();

  return { host, guest, connection: await connecting };
}

test('a discovering tab finds advertising tabs once and hears when they stop', async () => {
  const host = new BroadcastTransport();
  const guest = new BroadcastTransport();
  const found = record(guest, TransportEvent.EndpointFound);
  const lost = record(guest, TransportEvent.EndpointLost);
  await host.startAdvertising(AD);
  await guest.startDiscovery();
  await settle();
  expect(found).toEqual([{ endpointId: host.id, advertisement: AD }]);

  await host.stopAdvertising();
  await settle();
  expect(lost).toEqual([{ endpointId: host.id }]);
});

test('channels keep tabs apart', async () => {
  const host = new BroadcastTransport('scenario-a');
  const guest = new BroadcastTransport('scenario-b');
  const found = record(guest, TransportEvent.EndpointFound);
  await host.startAdvertising(AD);
  await guest.startDiscovery();
  await settle();
  expect(found).toEqual([]);
});

test('a guest connects to an advertising host, and both sides share the token', async () => {
  const host = new BroadcastTransport();
  const peers = record(host, TransportEvent.PeerConnected);
  const guest = new BroadcastTransport();
  await host.startAdvertising(AD);
  const connecting = guest.connect(host.id);
  await settle();
  const connection = await connecting;

  expect(connection.peerId).toBe(host.id);
  expect(peers).toEqual([{ peerId: guest.id, authToken: connection.authToken }]);
});

test('data flows both ways over a connection only', async () => {
  const { host, guest } = await connected();
  const atHost = record(host, TransportEvent.Data);
  const atGuest = record(guest, TransportEvent.Data);
  await guest.send(host.id, 'hello');
  await host.send(guest.id, 'welcome');
  await settle();

  expect(atHost).toEqual([{ peerId: guest.id, data: 'hello' }]);
  expect(atGuest).toEqual([{ peerId: host.id, data: 'welcome' }]);
  await expect(guest.send('stranger', 'hi')).rejects.toThrow();
});

test('like Nearby, only the other side hears about a deliberate disconnect', async () => {
  const { host, guest } = await connected();
  const atHost = record(host, TransportEvent.PeerDisconnected);
  const atGuest = record(guest, TransportEvent.PeerDisconnected);
  await guest.disconnect();
  await settle();

  expect(atHost).toEqual([{ peerId: guest.id }]);
  expect(atGuest).toEqual([]);
});

test('a closing tab drops its connections', async () => {
  const onPageHide: (() => void)[] = [];
  globalThis.addEventListener = ((type: string, listener: () => void) => {
    if (type === 'pagehide') onPageHide.push(listener);
  }) as typeof globalThis.addEventListener;
  const { host, guest } = await connected();
  const atHost = record(host, TransportEvent.PeerDisconnected);
  onPageHide.at(-1)!();
  await settle();

  expect(atHost).toEqual([{ peerId: guest.id }]);
});

test('connecting to a tab that does not advertise fails', async () => {
  const host = new BroadcastTransport();
  const guest = new BroadcastTransport();
  const connecting = guest.connect(host.id);
  const failed = expect(connecting).rejects.toBeInstanceOf(ConnectFailedError);
  await settle();
  await failed;
});

test('a cancelled request leaves no connection behind', async () => {
  const host = new BroadcastTransport();
  const peers = record(host, TransportEvent.PeerDisconnected);
  const guest = new BroadcastTransport();
  await host.startAdvertising(AD);
  const abort = new AbortController();
  const connecting = guest.connect(host.id, abort.signal);
  const aborted = expect(connecting).rejects.toBeInstanceOf(AbortedError);
  abort.abort();
  await aborted;
  await settle();

  expect(peers).toEqual([{ peerId: guest.id }]);
});

test('reports a granted permission and a ready radio unless the harness says otherwise', async () => {
  const transport = new BroadcastTransport();
  expect(await transport.getPermission()).toBe(PermissionStatus.Granted);
  expect(await transport.getRadioState()).toBe(RadioState.Ready);
});
