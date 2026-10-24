import { useState } from 'react';

import type { GameState } from '@/domain';

import { turnKey } from '../view';

/**
 * The sheet shown on this phone. Every turn opens on its shared page; on my turn my tab
 * taps lead and are shared.
 */
export function useSheetPage(game: GameState | null, gameNumber: number) {
  const [sheetIndex, setSheetIndex] = useState(() => game?.turn.page ?? 0);
  const turn = turnKey(game, gameNumber);
  const [pageTurn, setPageTurn] = useState(turn);
  if (pageTurn !== turn) {
    setPageTurn(turn);
    setSheetIndex(game?.turn.page ?? 0);
  }

  return [sheetIndex, setSheetIndex] as const;
}
