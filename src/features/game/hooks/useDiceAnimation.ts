import { useEffect, useLayoutEffect, useReducer } from 'react';

import type { Turn } from '@/domain';
import { useTheme } from '@/ui';

import {
  buildDiceAnimationView,
  diceAnimationReducer,
  DiceEvent,
  initDiceAnimation,
  ROLL_PENDING_MS,
  SHAKE_MS,
} from '../view';

/**
 * Wires the clock to the dice animation (`view/diceAnimation.ts`, which holds its rules): each
 * turn from the host, the shakes while my request waits, the landing and the request timeout.
 */
export function useDiceAnimation(turn: Turn | undefined) {
  const { reduceMotion } = useTheme();
  const [state, dispatch] = useReducer(diceAnimationReducer, turn, initDiceAnimation);
  const view = buildDiceAnimationView(state, turn, reduceMotion);
  const { rollPending } = view;
  // Only a roll that has arrived lands; the shakes of a waiting request just keep going.
  const shakeEndsAt = view.shownSeq < view.rollSeq ? state.shakeEndsAt : null;

  // Before paint, so a new roll starts shaking in the frame it first shows up.
  useLayoutEffect(() => {
    dispatch({ type: DiceEvent.Turn, turn, now: Date.now(), reduceMotion });
  }, [turn, reduceMotion]);

  // Keep shaking while the host has not answered yet.
  useEffect(() => {
    if (!rollPending || reduceMotion) return;
    const timer = setInterval(() => dispatch({ type: DiceEvent.Shake, now: Date.now() }), SHAKE_MS);

    return () => clearInterval(timer);
  }, [rollPending, reduceMotion]);

  // If the host never answers, unlock the button again.
  useEffect(() => {
    if (!rollPending) return;
    const timer = setTimeout(() => dispatch({ type: DiceEvent.GiveUp }), ROLL_PENDING_MS);

    return () => clearTimeout(timer);
  }, [rollPending]);

  // The new faces land when the running shake ends.
  useEffect(() => {
    if (shakeEndsAt === null) return;
    const wait = Math.max(0, shakeEndsAt - Date.now());
    const timer = setTimeout(() => dispatch({ type: DiceEvent.Land }), wait);

    return () => clearTimeout(timer);
  }, [shakeEndsAt]);

  return {
    ...view,
    /** My own roll: shake right away, before the result is known. */
    request: () => dispatch({ type: DiceEvent.Request, now: Date.now(), reduceMotion }),
  };
}
