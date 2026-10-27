/**
 * Transport for the web build, which only the browser harness uses: each browser tab plays one
 * phone, and a BroadcastChannel is the air between them (docs/technical-design.md, Browser
 * harness). Behaves like Nearby: advertisements reach discovering tabs, a guest connects to one
 * host, only the other side hears about a deliberate disconnect, and a closed tab drops out.
 */
import { AbortedError, Emitter, HarnessParam, harnessParam, randomId } from '@/lib';
import type { Unsubscribe } from '@/lib';

import { decodeAdvertisement, encodeAdvertisement } from '../advertisement';
import type { Advertisement } from '../advertisement';
import { ConnectFailedError, PermissionStatus, RadioState, TransportEvent } from '../transport';
import type { Connection, EndpointId, PeerId, Transport, TransportEvents } from '../transport';

/** Shared by every tab of the app; scenarios pass their own to stay among themselves. */
const DEFAULT_CHANNEL = 'nearbydice';
/** A host that does not answer by then is gone. */
const CONNECT_TIMEOUT_MS = 3000;

enum Signal {
  /** An advertisement, or `null` when advertising stopped. */
  Advertise = 'advertise',
  /** Asks every advertising tab to send its advertisement. */
  Discover = 'discover',
  Connect = 'connect',
  Accept = 'accept',
  Reject = 'reject',
  Data = 'data',
  Disconnect = 'disconnect',
  /** The tab is closing or reloading. */
  Leave = 'leave',
}

type Message = { from: string } & (
  | { signal: Signal.Advertise; endpointName: string | null }
  | { signal: Signal.Discover | Signal.Leave }
  | { signal: Signal.Connect | Signal.Reject | Signal.Disconnect; to: string }
  | { signal: Signal.Accept; to: string; authToken: string }
  | { signal: Signal.Data; to: string; data: string }
);

type PendingConnect = { resolve: (connection: Connection) => void; reject: (error: Error) => void };

function enumParam<T extends string>(
  name: HarnessParam,
  values: Record<string, T>,
  fallback: T,
): T {
  const value = harnessParam(name);

  return Object.values(values).find((known) => known === value) ?? fallback;
}

export class BroadcastTransport implements Transport {
  readonly id = randomId(8);
  private readonly emitter = new Emitter<TransportEvents>();
  private readonly channel: BroadcastChannel;
  private endpointName: string | null = null;
  private discovering = false;
  /** Discovered endpoints and the name each was last heard with. */
  private readonly found = new Map<EndpointId, string>();
  private readonly peers = new Set<PeerId>();
  private readonly pending = new Map<EndpointId, PendingConnect>();

  constructor(channel = DEFAULT_CHANNEL) {
    this.channel = new BroadcastChannel(channel);
    this.channel.onmessage = ({ data }: MessageEvent<Message>) => this.receive(data);
    globalThis.addEventListener?.('pagehide', () => this.leave());
  }

  async getPermission(): Promise<PermissionStatus> {
    return enumParam(HarnessParam.Permission, PermissionStatus, PermissionStatus.Granted);
  }

  requestPermission(): Promise<PermissionStatus> {
    return this.getPermission();
  }

  async getRadioState(): Promise<RadioState> {
    return enumParam(HarnessParam.Radio, RadioState, RadioState.Ready);
  }

  async startAdvertising(advertisement: Advertisement): Promise<void> {
    this.endpointName = encodeAdvertisement(advertisement);
    this.post({ signal: Signal.Advertise, from: this.id, endpointName: this.endpointName });
  }

  async stopAdvertising(): Promise<void> {
    if (this.endpointName === null) return;
    this.endpointName = null;
    this.post({ signal: Signal.Advertise, from: this.id, endpointName: null });
  }

  async startDiscovery(): Promise<void> {
    this.discovering = true;
    this.found.clear();
    this.post({ signal: Signal.Discover, from: this.id });
  }

  async stopDiscovery(): Promise<void> {
    this.discovering = false;
    this.found.clear();
  }

  connect(endpointId: EndpointId, signal?: AbortSignal): Promise<Connection> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(new AbortedError());
      const settle = (error: Error | null, connection?: Connection) => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        this.pending.delete(endpointId);
        if (error) reject(error);
        else resolve(connection!);
      };

      const onAbort = () => settle(new AbortedError());
      const timer = setTimeout(
        () => settle(new ConnectFailedError(endpointId)),
        CONNECT_TIMEOUT_MS,
      );

      signal?.addEventListener('abort', onAbort, { once: true });
      this.pending.set(endpointId, {
        resolve: (connection) => settle(null, connection),
        reject: (error) => settle(error),
      });
      this.post({ signal: Signal.Connect, from: this.id, to: endpointId });
    });
  }

  async send(peerId: PeerId, data: string): Promise<void> {
    if (!this.peers.has(peerId)) throw new Error(`Not connected to ${peerId}`);
    this.post({ signal: Signal.Data, from: this.id, to: peerId, data });
  }

  async disconnect(peerId?: PeerId): Promise<void> {
    for (const peer of [...this.peers]) {
      if (peerId && peer !== peerId) continue;
      this.peers.delete(peer);
      this.post({ signal: Signal.Disconnect, from: this.id, to: peer });
    }
  }

  on<E extends TransportEvent>(
    event: E,
    listener: (payload: TransportEvents[E]) => void,
  ): Unsubscribe {
    return this.emitter.on(event, listener);
  }

  private leave(): void {
    this.post({ signal: Signal.Leave, from: this.id });
  }

  private post(message: Message): void {
    this.channel.postMessage(message);
  }

  private receive(message: Message): void {
    if ('to' in message && message.to !== this.id) return;
    const { from } = message;
    switch (message.signal) {
      case Signal.Advertise:
        return this.hearAdvertisement(from, message.endpointName);
      case Signal.Discover:
        if (this.endpointName !== null)
          this.post({ signal: Signal.Advertise, from: this.id, endpointName: this.endpointName });

        return;
      case Signal.Connect:
        return this.accept(from);
      case Signal.Accept:
        // A request cancelled meanwhile must leave no connection behind.
        if (!this.pending.has(from))
          return this.post({ signal: Signal.Disconnect, from: this.id, to: from });
        this.peers.add(from);
        this.pending.get(from)!.resolve({ peerId: from, authToken: message.authToken });

        return;
      case Signal.Reject:
        return this.pending.get(from)?.reject(new ConnectFailedError(from));
      case Signal.Data:
        if (this.peers.has(from))
          this.emitter.emit(TransportEvent.Data, { peerId: from, data: message.data });

        return;
      case Signal.Disconnect:
        return this.dropPeer(from);
      case Signal.Leave:
        this.dropPeer(from);
        this.pending.get(from)?.reject(new ConnectFailedError(from));

        return this.hearAdvertisement(from, null);
    }
  }

  private hearAdvertisement(endpointId: EndpointId, endpointName: string | null): void {
    if (!this.discovering || this.found.get(endpointId) === endpointName) return;
    const advertisement = endpointName === null ? null : decodeAdvertisement(endpointName);
    if (advertisement) {
      this.found.set(endpointId, endpointName!);
      this.emitter.emit(TransportEvent.EndpointFound, { endpointId, advertisement });
    } else if (this.found.delete(endpointId)) {
      this.emitter.emit(TransportEvent.EndpointLost, { endpointId });
    }
  }

  /** Host side; like the native module, every request is accepted while advertising. */
  private accept(guestId: string): void {
    if (this.endpointName === null) {
      this.post({ signal: Signal.Reject, from: this.id, to: guestId });

      return;
    }

    const authToken = randomId(5).toUpperCase();
    this.peers.add(guestId);
    // Sent before the event, whose listeners may already send data to the guest.
    this.post({ signal: Signal.Accept, from: this.id, to: guestId, authToken });
    this.emitter.emit(TransportEvent.PeerConnected, { peerId: guestId, authToken });
  }

  private dropPeer(peerId: PeerId): void {
    if (this.peers.delete(peerId)) this.emitter.emit(TransportEvent.PeerDisconnected, { peerId });
  }
}
