/** Who is playing and who is missing: the player pills and the connection banner. */
import type { TFunction } from '@/i18n';
import { Link, totalOf } from '@/domain';
import { ConnectionStatus, firstLostPlayer, playerById, Role } from '@/session';
import type { PlayerInfo } from '@/session';
import { avatarOf } from '@/shared';
import type { AvatarView } from '@/shared';

import type { TurnContext } from './turnContext';

export type PillView = {
  id: string;
  name: string;
  avatar: AvatarView;
  total: number;
  /** Their turn. */
  active: boolean;
  /** Their sheet is on the card: the turn's, or the one opened from the pills. */
  shown: boolean;
  dimmed: boolean;
};

export enum BannerKind {
  OwnConnection = 'own-connection',
  PlayerLostHost = 'player-lost-host',
  PlayerLostGuest = 'player-lost-guest',
}

export type BannerView = { kind: BannerKind; message: string };

export function buildPills(ctx: TurnContext): PillView[] {
  const { snapshot, game, turn } = ctx;
  const shownId = ctx.viewed?.player.id ?? turn.playerId;

  return game.turnOrder
    .map((id) => playerById(snapshot, id))
    .filter((p): p is PlayerInfo => !!p && p.link !== Link.Removed)
    .map((p) => ({
      id: p.id,
      name: p.name,
      avatar: avatarOf(p),
      total: totalOf(game, p.id),
      active: p.id === turn.playerId,
      shown: p.id === shownId,
      dimmed: p.link !== Link.Connected,
    }));
}

/** The player whose turn it is goes first: only they can be skipped by the engine. */
export function lostPlayerOf(ctx: TurnContext): PlayerInfo | null {
  const { turnPlayer, snapshot } = ctx;
  const turnPlayerLost =
    turnPlayer.id !== snapshot.myId &&
    (turnPlayer.link === Link.Lost || turnPlayer.link === Link.Left);

  return turnPlayerLost ? turnPlayer : (firstLostPlayer(snapshot) ?? null);
}

/** My own connection comes first; a lost player only matters while the game runs. */
export function buildBanner(
  t: TFunction,
  ctx: TurnContext,
  lost: PlayerInfo | null,
): BannerView | null {
  const { connection, role } = ctx.snapshot;
  if (connection.status === ConnectionStatus.Reconnecting) {
    return {
      kind: BannerKind.OwnConnection,
      message: t('game.ownConnectionLost', { attempt: connection.attempt }),
    };
  }

  if (!lost || !ctx.playing) return null;

  return role === Role.Host
    ? { kind: BannerKind.PlayerLostHost, message: t('game.lostHost', { name: lost.name }) }
    : { kind: BannerKind.PlayerLostGuest, message: t('game.lostGuest', { name: lost.name }) };
}
