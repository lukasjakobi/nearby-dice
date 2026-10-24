import { useCallback, useEffect, useState } from 'react';

import { isYatzy } from '@/domain';
import type { Dice } from '@/domain';
import { playerById } from '@/session';
import type { SessionSnapshot } from '@/session';
import { useFeedback } from '@/shared';

import { buildYatzyFlag } from '../view';
import type { YatzyFlagView } from '../view';

/**
 * Five equal dice wave a flag on every phone, the moment they land: after the shake, so
 * the flag never gives the roll away. Only a roll seen landing counts, never the dice
 * already on the table when the screen opens.
 */
export function useYatzyFlag(snapshot: SessionSnapshot, shownSeq: number, shownDice: Dice) {
  const feedback = useFeedback();
  const watching = useFeedback({ vibrate: false });
  const [flag, setFlag] = useState<YatzyFlagView | null>(null);
  const [landedSeq, setLandedSeq] = useState(shownSeq);
  const rollerId = snapshot.shared.game?.turn.playerId;

  // Derived during render, so the flag shows in the same frame as the dice.
  if (shownSeq !== landedSeq) {
    setLandedSeq(shownSeq);
    const roller = rollerId ? playerById(snapshot, rollerId) : undefined;
    if (shownSeq > landedSeq && isYatzy(shownDice) && roller)
      setFlag(buildYatzyFlag(roller, shownSeq));
  }

  const flagSeq = flag?.seq;
  const mine = rollerId === snapshot.myId;
  useEffect(() => {
    if (flagSeq === undefined) return;
    (mine ? feedback : watching).fanfare();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per flag
  }, [flagSeq]);

  const close = useCallback(() => setFlag(null), []);

  return { flag, close };
}
