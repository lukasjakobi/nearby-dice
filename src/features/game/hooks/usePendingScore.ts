import { useEffect, useState } from 'react';

import type { Category } from '@/domain';
import type { SessionSnapshot } from '@/session';

import { turnKey } from '../view';

/** A score request gets this long to show up before the button unlocks again. */
const SCORE_PENDING_MS = 2000;

/** The field I picked and, once "Eintragen" is pressed, its entry on the way to the host. */
type PendingScore = {
  category: Category;
  sheet: number;
  rollSeq: number;
  historyLength: number;
  /** "Eintragen" was pressed; waiting for the entry to arrive. */
  sent: boolean;
};

/** My pick before "Eintragen", and the entry while the host confirms it. */
export function usePendingScore(
  snapshot: SessionSnapshot,
  sheetIndex: number,
  rollPending: boolean,
) {
  const game = snapshot.shared.game;
  const [pending, setPending] = useState<PendingScore | null>(null);
  // A pick ends with its turn, also when the time runs out or a new game starts.
  const turn = turnKey(game, snapshot.shared.gameNumber);
  const [pendingTurn, setPendingTurn] = useState(turn);
  if (pendingTurn !== turn) {
    setPendingTurn(turn);
    setPending(null);
  }

  const scorePending = !!pending?.sent && pending.historyLength === game?.history.length;

  // Within its turn, the selection only counts for the roll and sheet it was made in.
  const selectedCategory =
    pending &&
    game &&
    game.turn.playerId === snapshot.myId &&
    !rollPending &&
    pending.sheet === sheetIndex &&
    pending.rollSeq === game.turn.rollSeq &&
    pending.historyLength === game.history.length
      ? pending.category
      : null;

  // If the host never confirms the entry, unlock "Eintragen" again.
  const sent = !!pending?.sent;
  useEffect(() => {
    if (!sent) return;
    const timer = setTimeout(
      () => setPending((p) => (p?.sent ? { ...p, sent: false } : p)),
      SCORE_PENDING_MS,
    );

    return () => clearTimeout(timer);
  }, [sent]);

  return {
    pending,
    selectedCategory,
    scorePending,
    select: (category: Category, sheet: number) => {
      if (!game) return;
      setPending({
        category,
        sheet,
        rollSeq: game.turn.rollSeq,
        historyLength: game.history.length,
        sent: false,
      });
    },
    // Keep the selection until the entry arrives, so the bar does not flash back
    // to "Nochmal würfeln" while the host confirms it.
    markSent: () => setPending((p) => (p ? { ...p, sent: true } : p)),
    clear: () => setPending(null),
  };
}
