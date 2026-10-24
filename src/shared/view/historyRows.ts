import type { TFunction } from '@/i18n';
import { HistoryKind } from '@/domain';
import type { GameState, HistoryEntry, NamedPlayer } from '@/domain';

import { avatarOf } from './avatar';
import type { AvatarView } from './avatar';

/** One entry of "Verlauf". */
export type HistoryRow = {
  seq: number;
  round: number;
  name: string;
  avatar: AvatarView;
  /** Field and points, or what the host did. */
  title: string;
  detail: string | null;
  points: number | null;
  dice: number[] | null;
};

function historyRow(
  t: TFunction,
  game: GameState,
  player: NamedPlayer,
  entry: HistoryEntry,
): HistoryRow {
  const base = { seq: entry.seq, round: entry.round, name: player.name, avatar: avatarOf(player) };
  switch (entry.kind) {
    case HistoryKind.Scored:
    case HistoryKind.AutoScored:
      return {
        ...base,
        title: t(`labels.category.${entry.category}`),
        detail: entry.kind === HistoryKind.AutoScored ? t('game.historyEntry.automatic') : null,
        points: entry.points,
        dice: [...entry.dice],
      };
    case HistoryKind.Skipped:
      return {
        ...base,
        title: t('game.historyEntry.skipped'),
        detail: null,
        points: null,
        dice: null,
      };
    case HistoryKind.Removed:
      return {
        ...base,
        title: t('game.historyEntry.removed'),
        detail: null,
        points: null,
        dice: null,
      };
  }
}

/** "Verlauf": the whole score history of a game, newest first. */
export function historyRows(
  t: TFunction,
  game: GameState,
  players: readonly NamedPlayer[],
): HistoryRow[] {
  return [...game.history].reverse().map((entry) =>
    historyRow(
      t,
      game,
      players.find((player) => player.id === entry.playerId)!,
      entry,
    ),
  );
}
