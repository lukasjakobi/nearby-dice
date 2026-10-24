/** The action bar: the five dice, and the roll button or who is playing right now. */
import type { TFunction } from '@/i18n';

import type { CellView } from './sheetView';
import type { TurnContext } from './turnContext';

export type DieView = {
  value: number;
  held: boolean;
  canToggle: boolean;
  /** A field is selected: these dice are what gets scored, they will not be rolled again. */
  locked: boolean;
  label: string;
};

export enum ControlKind {
  MyTurn = 'my-turn',
  Waiting = 'waiting',
}

/** The roll counter of the player whose turn it is; drawn alike on every phone. */
export type RollsView = {
  rollsText: string;
  /** For screen readers: names the player on someone else's turn. */
  rollsLabel: string;
  rollsLeft: number;
  rollsTotal: number;
};

export type ControlView =
  | (RollsView & {
      kind: ControlKind.MyTurn;
      rollLabel: string;
      canRoll: boolean;
      /** The dice are in the air: the button ignores presses but does not dim. */
      rollBusy: boolean;
    })
  | (RollsView & { kind: ControlKind.Waiting; text: string; busy: boolean });

/** The dice shake, or my roll is on its way to the host. */
const rollInFlight = (ctx: TurnContext) => ctx.local.rolling || ctx.local.rollPending;

/** `focused` is the selected field: with one, the dice are locked in for scoring. */
export function buildDice(t: TFunction, ctx: TurnContext, focused: CellView | null): DieView[] {
  const { rolled, turn } = ctx;
  const locked = focused !== null;
  const canToggle =
    ctx.myTurn &&
    rolled &&
    ctx.rollsLeft > 0 &&
    ctx.live &&
    !rollInFlight(ctx) &&
    !ctx.local.scorePending &&
    !locked;

  return ctx.local.shownDice.map((value, i) => {
    const shown = rolled ? value : 0;

    return {
      value: shown,
      held: rolled && turn.held[i],
      canToggle,
      locked,
      label: dieLabel(t, i + 1, shown, turn.held[i]),
    };
  });
}

function dieLabel(t: TFunction, n: number, value: number, held: boolean): string {
  if (!value) return t('game.dieLabel.unrolled', { n });

  return held ? t('game.dieLabel.held', { n, value }) : t('game.dieLabel.rolled', { n, value });
}

export function buildControl(
  t: TFunction,
  ctx: TurnContext,
  focused: CellView | null,
): ControlView {
  const rolls = rollsView(t, ctx);
  if (!ctx.myTurn) {
    return {
      ...rolls,
      kind: ControlKind.Waiting,
      text: waitingText(t, ctx, focused),
      busy: ctx.turnPlayerHere,
    };
  }

  const rollAllowed = ctx.rollsLeft > 0 && ctx.live;

  return {
    ...rolls,
    kind: ControlKind.MyTurn,
    rollLabel: rollLabel(t, ctx),
    canRoll: rollAllowed && !rollInFlight(ctx),
    rollBusy: rollAllowed && rollInFlight(ctx),
  };
}

function rollsView(t: TFunction, ctx: TurnContext): RollsView {
  const rollsText = t('game.rollsLeft', { count: ctx.rollsLeft });

  return {
    rollsText,
    rollsLabel: ctx.myTurn
      ? rollsText
      : t('game.rollsLeftOf', { name: ctx.turnPlayer.name, count: ctx.rollsLeft }),
    rollsLeft: ctx.rollsLeft,
    rollsTotal: ctx.rules.rollsPerTurn,
  };
}

function rollLabel(t: TFunction, ctx: TurnContext): string {
  if (!ctx.rolled) return t('game.roll');

  return ctx.rollsLeft > 0 ? t('game.rollAgain') : t('game.pickField');
}

/** What the other phones say while someone else plays. */
function waitingText(t: TFunction, ctx: TurnContext, focused: CellView | null): string {
  const { name } = ctx.turnPlayer;
  if (!ctx.turnPlayerHere) return t('game.unreachable', { name });
  if (ctx.local.rolling) return t('game.isRolling', { name });
  if (focused) return t('game.isPicking', { name, field: focused.label });

  return t('game.isUp', { name });
}
