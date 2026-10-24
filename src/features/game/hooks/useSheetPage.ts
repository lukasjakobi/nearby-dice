import { useState } from 'react';

import type { GameState } from '@/domain';

import { turnKey } from '../view';
import type { ViewedSheet } from '../view';

/**
 * The sheet shown on this phone. Every turn opens on its shared page; on my turn my tab
 * taps lead and are shared. A tapped pill opens another player's sheet on this phone
 * only, and it stays open until the turn ends.
 */
export function useSheetPage(game: GameState | null, gameNumber: number) {
  const [sheetIndex, setSheetIndex] = useState(() => game?.turn.page ?? 0);
  const [viewed, setViewed] = useState<ViewedSheet | null>(null);
  const turn = turnKey(game, gameNumber);
  const [pageTurn, setPageTurn] = useState(turn);
  if (pageTurn !== turn) {
    setPageTurn(turn);
    setSheetIndex(game?.turn.page ?? 0);
    setViewed(null);
  }

  return { sheetIndex, setSheetIndex, viewed, setViewed };
}
