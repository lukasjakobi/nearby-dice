/**
 * The "air" between FakeTransports: an in-memory network that behaves like
 * Nearby Connections (discovery, star connections, latency, drops). Lets the
 * session integration tests run real hosts and guests without radios.
 */
import { AbortedError, randomId } from '@/lib';

import type { Advertisement } from '../advertisement';
import { ConnectFailedError, TransportEvent } from '../transport';
import type { Connection, EndpointId, PeerId } from '../transport';
import type { FakeTransport } from './FakeTransport';

const linkKey = (a: string, b: string) => [a, b].sort().join('~');

export class FakeNetwork {
  private nodes = new Map<string, FakeTransport>();
  private advertisements = new Map<string, Advertisement>();
  private discovering = new Set<string>();
  private links = new Set<string>();
  private unreachableUntil = new Map<string, number>();
  private connectLatencyMs: number | null = null;

  constructor(readonly latencyMs = 25) {}

  register(node: FakeTransport): void {
    this.nodes.set(node.id, node);
  }

  // ── Advertising and discovery ────────────────────────────────────────────

  setAdvertisement(node: FakeTransport, advertisement: Advertisement | null): void {
    if (advertisement) this.advertisements.set(node.id, advertisement);
    else this.advertisements.delete(node.id);
    for (const id of this.discovering) {
      if (id !== node.id) this.announce(this.nodes.get(id)!, node.id);
    }
  }

  advertisementOf(node: FakeTransport): Advertisement | null {
    return this.advertisements.get(node.id) ?? null;
  }

  setDiscovering(node: FakeTransport, on: boolean): void {
    if (!on) {
      this.discovering.delete(node.id);

      return;
    }

    this.discovering.add(node.id);
    for (const id of this.advertisements.keys()) {
      if (id !== node.id) this.announce(node, id);
    }
  }

  private announce(listener: FakeTransport, advertiserId: string): void {
    const advertisement = this.advertisements.get(advertiserId);
    this.later(() => {
      if (!this.discovering.has(listener.id)) return;
      if (advertisement && this.isReachable(advertiserId)) {
        listener.receive(TransportEvent.EndpointFound, { endpointId: advertiserId, advertisement });
      } else {
        listener.receive(TransportEvent.EndpointLost, { endpointId: advertiserId });
      }
    });
  }

  // ── Connections ──────────────────────────────────────────────────────────

  connect(guest: FakeTransport, endpointId: EndpointId, signal?: AbortSignal): Promise<Connection> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(new AbortedError());
      const onAbort = () => {
        clearTimeout(timer);
        reject(new AbortedError());
      };

      signal?.addEventListener('abort', onAbort, { once: true });
      const timer = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        const host = this.nodes.get(endpointId);
        const reachable =
          host &&
          this.advertisements.has(endpointId) &&
          this.isReachable(endpointId) &&
          this.isReachable(guest.id);
        if (!host || !reachable) {
          reject(new ConnectFailedError(endpointId));

          return;
        }

        const authToken = randomId(5).toUpperCase();
        this.links.add(linkKey(guest.id, host.id));
        host.receive(TransportEvent.PeerConnected, { peerId: guest.id, authToken });
        resolve({ peerId: host.id, authToken });
      }, this.connectLatencyMs ?? this.latencyMs);
    });
  }

  send(from: FakeTransport, to: PeerId, data: string): void {
    const key = linkKey(from.id, to);
    this.later(() => {
      if (!this.links.has(key)) return;
      this.nodes.get(to)?.receive(TransportEvent.Data, { peerId: from.id, data });
    });
  }

  /** Like Nearby: only the other side is told about a deliberate disconnect. */
  disconnect(from: FakeTransport, peerId?: PeerId): void {
    for (const other of this.peersOf(from.id)) {
      if (peerId && other !== peerId) continue;
      this.links.delete(linkKey(from.id, other));
      this.later(() =>
        this.nodes.get(other)?.receive(TransportEvent.PeerDisconnected, { peerId: from.id }),
      );
    }
  }

  isLinked(a: string, b: string): boolean {
    return this.links.has(linkKey(a, b));
  }

  peersOf(id: string): string[] {
    return [...this.links]
      .map((key) => key.split('~'))
      .filter((pair) => pair.includes(id))
      .map((pair) => (pair[0] === id ? pair[1] : pair[0]));
  }

  // ── Fault injection (tests) ────────────────────────────────

  /** Drops connections as if the radio failed; both sides are told. */
  cut(node: FakeTransport, peerId?: PeerId): void {
    for (const other of this.peersOf(node.id)) {
      if (peerId && other !== peerId) continue;
      this.links.delete(linkKey(node.id, other));
      this.later(() => {
        node.receive(TransportEvent.PeerDisconnected, { peerId: other });
        this.nodes.get(other)?.receive(TransportEvent.PeerDisconnected, { peerId: node.id });
      });
    }
  }

  /** Connection requests take `ms` to complete, like a slow radio handshake. */
  delayConnects(ms: number): void {
    this.connectLatencyMs = ms;
  }

  /** Makes a node unreachable for `ms`: links drop, connects fail, it vanishes from discovery. */
  makeUnreachable(node: FakeTransport, ms: number): void {
    this.unreachableUntil.set(node.id, Date.now() + ms);
    this.cut(node);
    this.refreshDiscovery(node.id);
    setTimeout(() => this.refreshDiscovery(node.id), ms + 1);
  }

  private refreshDiscovery(advertiserId: string): void {
    for (const id of this.discovering) {
      if (id !== advertiserId) this.announce(this.nodes.get(id)!, advertiserId);
    }
  }

  private isReachable(id: string): boolean {
    return (this.unreachableUntil.get(id) ?? 0) <= Date.now();
  }

  private later(fn: () => void): void {
    setTimeout(fn, this.latencyMs);
  }
}
