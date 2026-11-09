/**
 * The host's open connections and their liveness: who still owes a HELLO, how many
 * messages each sends, when each was last heard and which state it already has.
 */
import type { PlayerId } from '@/domain';
import type { PeerId } from '@/net';

import { MAX_MESSAGES_PER_WINDOW, MAX_PENDING_ADMISSIONS, TIMING } from './timing';

export type PeerLink = {
  authToken: string;
  playerId: PlayerId | null;
  /** HELLO was answered: each connection is admitted at most once. */
  greeted: boolean;
  lastSeen: number;
  /** Start of the current rate window and the messages received in it. */
  windowStart: number;
  windowMessages: number;
  /** The `rev` of the last full state sent, so a broadcast skips a peer that has it. */
  sentRev: number;
};

export class PeerLinks {
  private readonly links = new Map<PeerId, PeerLink>();

  /** Registers a new connection, or returns null while too many still owe their HELLO. */
  open(peerId: PeerId, authToken: string, now: number): PeerLink | null {
    const pending = [...this.links.values()].filter((link) => !link.greeted).length;
    if (pending >= MAX_PENDING_ADMISSIONS) return null;
    const link: PeerLink = {
      authToken,
      playerId: null,
      greeted: false,
      lastSeen: now,
      windowStart: now,
      windowMessages: 0,
      sentRev: 0,
    };
    this.links.set(peerId, link);

    return link;
  }

  get(peerId: PeerId): PeerLink | undefined {
    return this.links.get(peerId);
  }

  has(peerId: PeerId): boolean {
    return this.links.has(peerId);
  }

  delete(peerId: PeerId): void {
    this.links.delete(peerId);
  }

  /** Counts one message; false once the peer goes over its rate limit. */
  withinRate(link: PeerLink, now: number): boolean {
    if (now - link.windowStart >= TIMING.rateWindow) {
      link.windowStart = now;
      link.windowMessages = 0;
    }

    return ++link.windowMessages <= MAX_MESSAGES_PER_WINDOW;
  }

  /** Splits seated peers into those still answering and those silent for too long. */
  sweep(now: number): { alive: PeerId[]; silent: PeerId[] } {
    const alive: PeerId[] = [];
    const silent: PeerId[] = [];
    for (const [peerId, link] of this.seated()) {
      (now - link.lastSeen > TIMING.livenessTimeout ? silent : alive).push(peerId);
    }

    return { alive, silent };
  }

  /** Connections that belong to a player. */
  seated(): [PeerId, PeerLink][] {
    return [...this.links].filter(([, link]) => link.playerId);
  }

  peerIds(): PeerId[] {
    return [...this.links.keys()];
  }

  clear(): void {
    this.links.clear();
  }
}
