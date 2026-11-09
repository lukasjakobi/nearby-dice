/**
 * The dice animation as a pure state machine: the hook feeds it turns, presses and timer
 * ticks, and draws what `buildDiceAnimationView` returns.
 *
 * Every phone animates the same roll: when `rollSeq` increases, the unheld dice shake and the
 * new faces land afterwards. With reduced motion they land at once.
 *
 * On my own roll the dice start shaking the moment I press the button (`Request`) and keep
 * shaking until the result arrives, so a slow connection never feels like a dead button. The
 * result lands at the end of the shake that is running.
 *
 * While the dice shake, the turn as it was before the roll stays on screen, so the scorecard
 * keeps its previews until the new faces land.
 *
 * A shake or roll request never outlives its turn: once the turn passes on, the new turn shows
 * at once, without the old roll's dice, previews or busy button.
 */
import { NO_DICE, sameTurn } from '@/domain';
import type { Dice, Turn } from '@/domain';

/** Dice shake for 2 × 160 ms before the new faces show. */
export const SHAKE_MS = 320;

/** A roll request gets this long to show up before the button unlocks again. */
export const ROLL_PENDING_MS = 2000;

export type DiceAnimationState = {
  /** The latest turn from the host. */
  turn: Turn | undefined;
  /** The turn whose faces are on screen; behind `turn` while the dice shake. */
  settled: Turn | undefined;
  /** One counter per die; a die shakes each time its key changes. */
  shakeKeys: number[];
  /** The turn at the moment "Würfeln" was pressed; pending until its roll counter moves. */
  requested: Turn | null;
  /** When the running shake ends (ms since epoch), or `null` when no die shakes. */
  shakeEndsAt: number | null;
};

export enum DiceEvent {
  /** A turn arrived from the host (or the reduce-motion setting changed). */
  Turn = 'turn',
  /** I pressed "Würfeln". */
  Request = 'request',
  /** Another shake while my request waits for the host. */
  Shake = 'shake',
  /** The running shake ended: the new faces land. */
  Land = 'land',
  /** The host never answered my request: the button unlocks again. */
  GiveUp = 'give-up',
}

export type DiceAction =
  | { type: DiceEvent.Turn; turn: Turn | undefined; now: number; reduceMotion: boolean }
  | { type: DiceEvent.Request; now: number; reduceMotion: boolean }
  | { type: DiceEvent.Shake; now: number }
  | { type: DiceEvent.Land }
  | { type: DiceEvent.GiveUp };

export type DiceAnimationView = {
  /** Dice as currently drawn (they change after the shake). */
  shownDice: Dice;
  /** The shown dice come from a roll in this turn (the old roll while shaking). */
  shownRolled: boolean;
  shakeKeys: number[];
  /** The dice shake: a roll is landing or my request is waiting. */
  rolling: boolean;
  rollPending: boolean;
  rollSeq: number;
  /** The roll whose faces are on screen: it moves once they have landed. */
  shownSeq: number;
};

export function initDiceAnimation(turn: Turn | undefined): DiceAnimationState {
  return { turn, settled: turn, shakeKeys: [0, 0, 0, 0, 0], requested: null, shakeEndsAt: null };
}

/** Shakes every die that the next roll will throw: all of them, except held ones on a re-roll. */
function bump(keys: number[], turn: Turn | undefined): number[] {
  return keys.map((key, i) => (turn && turn.rollsUsed > 0 && turn.held[i] ? key : key + 1));
}

/** A request only counts in the turn it was made in. */
function liveRequest(requested: Turn | null, turn: Turn | undefined): Turn | null {
  return requested && turn && sameTurn(requested, turn) ? requested : null;
}

/** A newer roll of the settled turn is waiting to land; rolls from a passed turn are not. */
function isLanding(settled: Turn | undefined, turn: Turn | undefined, reduceMotion: boolean) {
  return (
    !reduceMotion &&
    !!turn &&
    !!settled &&
    turn.rollSeq > settled.rollSeq &&
    sameTurn(settled, turn)
  );
}

/** One more shake while my roll is on its way. */
function shakeForRequest(state: DiceAnimationState, now: number): DiceAnimationState {
  return { ...state, shakeKeys: bump(state.shakeKeys, state.turn), shakeEndsAt: now + SHAKE_MS };
}

function receiveTurn(
  state: DiceAnimationState,
  turn: Turn | undefined,
  now: number,
  reduceMotion: boolean,
): DiceAnimationState {
  const requested = liveRequest(state.requested, turn);
  // The roll I asked for: its shake started on the press.
  const answered = !!requested && !!turn && requested.rollSeq < turn.rollSeq;
  if (!isLanding(state.settled, turn, reduceMotion)) {
    const pending = !!requested && !answered;

    return {
      ...state,
      turn,
      settled: turn,
      requested: pending ? requested : null,
      shakeEndsAt: pending ? state.shakeEndsAt : null,
    };
  }

  // Already shaking for this roll, or for my own: it lands when the running shake ends.
  if (answered || turn?.rollSeq === state.turn?.rollSeq) return { ...state, turn, requested };

  return {
    ...state,
    turn,
    requested,
    shakeKeys: bump(state.shakeKeys, state.settled),
    shakeEndsAt: now + SHAKE_MS,
  };
}

export function diceAnimationReducer(
  state: DiceAnimationState,
  action: DiceAction,
): DiceAnimationState {
  switch (action.type) {
    case DiceEvent.Turn:
      return receiveTurn(state, action.turn, action.now, action.reduceMotion);
    case DiceEvent.Request: {
      const asked = { ...state, requested: state.turn ?? null };

      return action.reduceMotion ? asked : shakeForRequest(asked, action.now);
    }

    case DiceEvent.Shake:
      return shakeForRequest(state, action.now);
    case DiceEvent.Land:
      return { ...state, settled: state.turn, requested: null, shakeEndsAt: null };
    case DiceEvent.GiveUp:
      return { ...state, requested: null };
  }
}

/**
 * What to draw for `turn`. It takes the turn the screen renders, not the one the state last saw,
 * so no frame ever shows a new roll before its shake, or an old turn's dice after it passed on.
 */
export function buildDiceAnimationView(
  state: DiceAnimationState,
  turn: Turn | undefined,
  reduceMotion: boolean,
): DiceAnimationView {
  const seq = turn?.rollSeq ?? 0;
  const requested = liveRequest(state.requested, turn);
  const pending = requested?.rollSeq === seq;
  const landing = isLanding(state.settled, turn, reduceMotion);
  const shown = landing ? state.settled : turn;

  return {
    shownDice: shown?.dice ?? NO_DICE,
    // Previews only belong to dice rolled in this same turn (a shake never spans two).
    shownRolled: !!shown && shown.rollsUsed > 0,
    shakeKeys: state.shakeKeys,
    rolling: landing || (pending && !reduceMotion),
    rollPending: pending,
    rollSeq: seq,
    shownSeq: shown?.rollSeq ?? seq,
  };
}
