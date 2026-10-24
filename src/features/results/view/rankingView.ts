/** The ranking: one row per player, winners first, and the headline above it. */
import type { TFunction } from '@/i18n';
import { playerTotal, ranking, upperBonus, upperSum, weightedSum } from '@/domain';
import type { GamePlayer, GameState, NamedPlayer } from '@/domain';
import { avatarOf } from '@/shared';
import type { AvatarView } from '@/shared';

export type RankRow = {
  id: string;
  place: number;
  name: string;
  avatar: AvatarView;
  points: number;
  isMe: boolean;
  winner: boolean;
  /** Points behind the winner; 0 for winners. */
  behind: number;
  /** Upper block, upper bonus and the rest, each weighted by its sheet factor. */
  upper: number;
  bonus: number;
  lower: number;
};

/** A row with the sheets behind it: what the awards and the comparison read. */
export type RankedPlayer = { row: RankRow; player: GamePlayer };

export const signed = (n: number) => (n ? `+${n}` : '–');

/** In ranking order. */
export function buildRanking(
  game: GameState,
  players: readonly NamedPlayer[],
  myId: string,
): RankedPlayer[] {
  const { rules } = game;
  const placements = ranking(game);
  const top = placements[0]?.total ?? 0;

  return placements.map((placement) => {
    const player = game.players.find((gp) => gp.id === placement.playerId)!;
    const info = players.find((p) => p.id === placement.playerId)!;
    const upper = weightedSum(player.sheets, upperSum);
    const bonus = weightedSum(player.sheets, (sheet) => upperBonus(sheet, rules));
    const row: RankRow = {
      id: placement.playerId,
      place: placement.place,
      name: info.name,
      avatar: avatarOf(info),
      points: placement.total,
      isMe: placement.playerId === myId,
      winner: placement.winner,
      behind: top - placement.total,
      upper,
      bonus,
      lower: playerTotal(player.sheets, rules) - upper - bonus,
    };

    return { row, player };
  });
}

/** "Du gewinnst!", "Anna gewinnt!" or "Unentschieden!" for a multiplayer game. */
export function winnerHeadline(t: TFunction, rows: readonly RankRow[]): string {
  const winners = rows.filter((row) => row.winner);
  if (winners.length > 1) return t('results.tie');

  return winners[0]?.isMe
    ? t('results.youWin')
    : t('results.winner', { name: winners[0]?.name ?? '' });
}
