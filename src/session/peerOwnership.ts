import type { PeerId, Transport } from '@/net';

const generations = new WeakMap<Transport, Map<PeerId, number>>();

/** Marks the latest owner of an endpoint link on a transport. */
export function claimPeer(transport: Transport, peerId: PeerId): number {
  let peers = generations.get(transport);
  if (!peers) {
    peers = new Map();
    generations.set(transport, peers);
  }

  const generation = (peers.get(peerId) ?? 0) + 1;
  peers.set(peerId, generation);

  return generation;
}

/** Prevents a delayed close from tearing down a newer session's link. */
export function isPeerOwner(transport: Transport, peerId: PeerId, generation: number): boolean {
  return generations.get(transport)?.get(peerId) === generation;
}
