/**
 * "Spielstand" (the standings and every player's sheet) and "Verlauf" (the full score
 * history). Every phone holds the complete game, so both are built locally.
 */
import type { TFunction } from '@/i18n';
import { gamePlayer, Link, ranking, YATZY_BONUS } from '@/domain';
import { playerById } from '@/session';
import type { SessionSnapshot } from '@/session';
import { avatarOf, historyRows } from '@/shared';
import type { AvatarView, HistoryRow } from '@/shared';

import { buildEntriesSheet } from './sheetView';
import type { SheetView } from './sheetView';

/** One player on "Spielstand": their place and total, and their sheets as on the game screen. */
export type PlayerBoard = {
  id: string;
  name: string;
  avatar: AvatarView;
  /** This phone's own player: the one "Spielstand" opens on. */
  me: boolean;
  /** 1 for the lead; equal totals share a place. */
  place: number;
  leading: boolean;
  /** The weighted total over all sheets. */
  total: string;
  accessibilityLabel: string;
  /** One scorecard per sheet (×1 ×2 ×3), with only the entries. */
  sheets: SheetView[];
  /** "Yatzy-Bonus +100" per sheet once extra Yatzys earned it, otherwise `null`. */
  yatzyBonus: (string | null)[];
};

export type ScoreboardView = {
  /** Highest total first. */
  players: PlayerBoard[];
  history: HistoryRow[];
};

export function buildScoreboard(t: TFunction, snapshot: SessionSnapshot): ScoreboardView | null {
  const game = snapshot.shared.game;
  if (!game) return null;

  const players = ranking(game)
    .map((placement) => ({ placement, info: playerById(snapshot, placement.playerId)! }))
    .filter(({ info }) => info.link !== Link.Removed)
    .map(({ placement, info }): PlayerBoard => {
      const me = info.id === snapshot.myId;
      const sheets = gamePlayer(game, info.id)!.sheets;

      return {
        id: info.id,
        name: info.name,
        avatar: avatarOf(info),
        me,
        place: placement.place,
        leading: placement.winner && placement.total > 0,
        total: String(placement.total),
        accessibilityLabel: `${placement.place}. ${info.name}, ${t('format.points', { count: placement.total })}`,
        sheets: sheets.map((_, index) => buildEntriesSheet(t, game, info, index, me)),
        yatzyBonus: sheets.map((sheet) =>
          sheet.extraYatzys > 0
            ? `${t('game.yatzyBonusRow')} +${sheet.extraYatzys * YATZY_BONUS}`
            : null,
        ),
      };
    });

  return { players, history: historyRows(t, game, snapshot.shared.players) };
}
