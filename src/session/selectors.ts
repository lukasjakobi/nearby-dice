/** Small, pure questions screens ask about a snapshot. */
import type { PlayerId } from '@/domain';
import { Link } from '@/domain';

import type { PlayerInfo, SessionSnapshot } from './types';

export function playerById(snapshot: SessionSnapshot, id: PlayerId): PlayerInfo | undefined {
  return snapshot.shared.players.find((p) => p.id === id);
}

export function me(snapshot: SessionSnapshot): PlayerInfo {
  return playerById(snapshot, snapshot.myId)!;
}

export function hostOf(snapshot: SessionSnapshot): PlayerInfo {
  return snapshot.shared.players.find((p) => p.isHost)!;
}

/** Players still in the session (removed ones are gone from every list). */
export function seatedPlayers(snapshot: SessionSnapshot): PlayerInfo[] {
  return snapshot.shared.players.filter((p) => p.link !== Link.Removed);
}

export function firstLostPlayer(snapshot: SessionSnapshot): PlayerInfo | undefined {
  return snapshot.shared.players.find(
    (p) => p.id !== snapshot.myId && (p.link === Link.Lost || p.link === Link.Left),
  );
}

/** Converts a host timestamp to this phone's clock. */
export function toLocalTime(snapshot: SessionSnapshot, hostTime: number): number {
  return hostTime + snapshot.clockOffset;
}
