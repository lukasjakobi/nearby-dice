import { useEffect, useRef, useState } from 'react';

import { NO_DICE, sameTurn } from '@/domain';
import type { Turn } from '@/domain';
import { useTheme } from '@/ui';

/** Dice shake for 2 × 160 ms before the new faces show. */
const SHAKE_MS = 320;

/** A roll request gets this long to show up before the button unlocks again. */
const ROLL_PENDING_MS = 2000;

/** Shakes every die that the next roll will throw: all of them, except held ones on a re-roll. */
function bump(keys: number[], turn: Turn | undefined): number[] {
  return keys.map((key, i) => (turn && turn.rollsUsed > 0 && turn.held[i] ? key : key + 1));
}

/**
 * Every phone animates the same roll: when `rollSeq` increases, the unheld dice
 * shake and the new values appear afterwards. With reduce motion, instantly.
 *
 * On my own roll the dice start shaking the moment I press the button (`request`)
 * and keep shaking until the result arrives, so a slow connection never feels like
 * a dead button. The result lands at the end of the shake that is running.
 *
 * While the dice shake, the turn as it was before the roll stays on screen, so
 * the scorecard keeps its previews until the new faces land.
 *
 * A shake or roll request never outlives its turn: once the turn passes on, the
 * new turn shows at once, without the old roll's dice, previews or busy button.
 */
export function useDiceAnimation(turn: Turn | undefined) {
  const { reduceMotion } = useTheme();
  const seq = turn?.rollSeq ?? 0;
  // The roll whose result is on screen; behind `seq` while the dice shake.
  const [shownSeq, setShownSeq] = useState(seq);
  // The turn as last drawn, kept while the dice shake.
  const [settled, setSettled] = useState(turn);
  const [shakeKeys, setShakeKeys] = useState([0, 0, 0, 0, 0]);
  const [shakenSeq, setShakenSeq] = useState(seq);
  // The turn at the moment "Würfeln" was pressed; pending until its roll counter moves.
  const [requested, setRequested] = useState<Turn | null>(null);
  const lastShake = useRef(0);
  const turnRef = useRef(turn);
  useEffect(() => {
    turnRef.current = turn;
  });

  // A request only counts in the turn it was made in.
  const live = !!requested && !!turn && sameTurn(requested, turn);
  const pending = live && requested.rollSeq === seq;
  // The shake for this roll already started when the button was pressed.
  const anticipated = live && requested.rollSeq < seq;
  // Rolls from a turn that has already passed on are not animated.
  const rolling = !!turn && !!settled && !reduceMotion && seq > shownSeq && sameTurn(settled, turn);

  // Derived during render, so no frame ever shows the new roll before the shake.
  if (requested && !live) setRequested(null);
  if (!rolling && (settled !== turn || shownSeq !== seq)) {
    setSettled(turn);
    setShownSeq(seq);
    if (anticipated) setRequested(null);
  }

  if (rolling && shakenSeq !== seq) {
    setShakenSeq(seq);
    if (!anticipated) setShakeKeys((keys) => bump(keys, settled));
  }

  // Keep shaking while the host has not answered yet.
  useEffect(() => {
    if (!pending || reduceMotion) return;
    const timer = setInterval(() => {
      lastShake.current = Date.now();
      setShakeKeys((keys) => bump(keys, turnRef.current));
    }, SHAKE_MS);

    return () => clearInterval(timer);
  }, [pending, reduceMotion]);

  // If the host never answers, unlock the button again.
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setRequested(null), ROLL_PENDING_MS);

    return () => clearTimeout(timer);
  }, [pending]);

  useEffect(() => {
    if (!rolling) return;
    let wait = SHAKE_MS;
    if (anticipated) wait = Math.max(0, lastShake.current + SHAKE_MS - Date.now());
    else lastShake.current = Date.now();
    const timer = setTimeout(() => {
      setShownSeq(seq);
      setRequested(null);
    }, wait);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per roll
  }, [rolling, seq]);

  /** My own roll: shake right away, before the result is known. */
  const request = () => {
    setRequested(turn ?? null);
    if (reduceMotion) return;
    lastShake.current = Date.now();
    setShakeKeys((keys) => bump(keys, turn));
  };

  const shown = rolling ? settled : turn;
  // Previews only belong to dice rolled in this same turn (a shake never spans two).
  const shownRolled = !!shown && shown.rollsUsed > 0;

  return {
    shownDice: shown?.dice ?? NO_DICE,
    shownRolled,
    shakeKeys,
    rolling: rolling || (pending && !reduceMotion),
    rollPending: pending,
    rollSeq: seq,
    request,
  };
}
