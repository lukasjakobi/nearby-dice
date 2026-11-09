import type { PeerId, Transport } from '@/net';

const generations = new WeakMap<Transport, Map<PeerId, number>>();

/** Marks the latest owner of an endpoint link on a transport. */
function claimPeer(transport: Transport, peerId: PeerId): number {
  let peers = generations.get(transport);
  if (!peers) {
    peers = new Map();
    generations.set(transport, peers);
  }

  const generation = (peers.get(peerId) ?? 0) + 1;
  peers.set(peerId, generation);

  return generation;
}

/**
 * The links one session claimed on a shared transport. A delayed close checks the
 * generation it was scheduled for, so it never tears down a newer session's link.
 */
export class OwnedPeers {
  private readonly generations = new Map<PeerId, number>();

  constructor(private readonly transport: Transport) {}

  claim(peerId: PeerId): void {
    this.generations.set(peerId, claimPeer(this.transport, peerId));
  }

  generationOf(peerId: PeerId): number | undefined {
    return this.generations.get(peerId);
  }

  /** Closes the link unless another session claimed it since `generation`. */
  disconnectIfOwned(peerId: PeerId, generation = this.generationOf(peerId)): void {
    if (generation === undefined) return;
    if (generations.get(this.transport)?.get(peerId) !== generation) return;
    void this.transport.disconnect(peerId);
  }

  /** Drops a link that is gone; a close already scheduled keeps its own generation. */
  forget(peerId: PeerId): void {
    this.generations.delete(peerId);
  }

  peerIds(): PeerId[] {
    return [...this.generations.keys()];
  }

  clear(): void {
    this.generations.clear();
  }
}
