import { Link } from '@/domain';
import { seatedPlayers } from '@/session';
import type { SessionSnapshot } from '@/session';

import { PlayerTag, RowStatus } from '../components/PlayerRow';
import type { PlayerRowView } from '../components/PlayerRow';
import { avatarOf } from './avatar';

/** Lobby rows for host and guest lobbies; removed players are gone. */
export function lobbyRows(snapshot: SessionSnapshot): PlayerRowView[] {
  return seatedPlayers(snapshot).map((player) => ({
    id: player.id,
    name: player.name,
    avatar: avatarOf(player),
    tags: [
      ...(player.isHost ? [PlayerTag.Host] : []),
      ...(player.id === snapshot.myId && !player.isHost ? [PlayerTag.You] : []),
    ],
    status: player.link === Link.Connected ? RowStatus.Connected : RowStatus.Reconnecting,
  }));
}
