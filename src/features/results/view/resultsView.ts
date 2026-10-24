/**
 * Everything the results screen shows about the finished game. Each card has its own
 * builder: `rankingView` (ranking and headline), `awardsView`, `compareView`.
 */
import type { GameState, NamedPlayer } from '@/domain';
import type { TFunction } from '@/i18n';

import { buildAwards } from './awardsView';
import type { Award } from './awardsView';
import { buildCompare } from './compareView';
import type { CompareRow } from './compareView';
import { buildRanking } from './rankingView';
import type { RankRow } from './rankingView';

export type ResultsView = {
  rows: RankRow[];
  awards: Award[];
  /** "Alle Felder im Vergleich": one column per player, in ranking order. */
  compare: CompareRow[];
};

export function buildResults(
  t: TFunction,
  game: GameState,
  players: readonly NamedPlayer[],
  myId: string,
): ResultsView {
  const ranked = buildRanking(game, players, myId);

  return {
    rows: ranked.map(({ row }) => row),
    awards: buildAwards(t, ranked, game.rules),
    compare: buildCompare(t, ranked, game.rules),
  };
}
