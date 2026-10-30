import { playedOn } from '@/i18n';
import type { TFunction } from '@/i18n';
import { matchPreset } from '@/domain';
import type { SavedGame } from '@/domain';
import { historyRows } from '@/shared';
import type { HistoryRow } from '@/shared';

import { winnerHeadline } from './rankingView';
import type { RankRow } from './rankingView';
import { buildResults } from './resultsView';
import type { ResultsView } from './resultsView';

export type SavedGameView = ResultsView & {
  /** The preset the game was played in. */
  title: string;
  when: string;
  winners: RankRow[];
  headline: string;
  history: HistoryRow[];
};

/** Everything a saved game shows when it is opened from the start screen. */
export function buildSavedGame(t: TFunction, saved: SavedGame): SavedGameView {
  const { game, players, myId } = saved;
  const results = buildResults(t, game, players, myId);
  const winners = results.rows.filter((row) => row.winner);
  // Saved games only hold preset games (see `isSavedGame`).
  const presetId = matchPreset(game.rules)!;

  return {
    ...results,
    title: t(`labels.preset.${presetId}.title`),
    when: playedOn(t, saved.playedAt),
    winners,
    headline: winnerHeadline(t, results.rows),
    history: historyRows(t, game, players),
  };
}
