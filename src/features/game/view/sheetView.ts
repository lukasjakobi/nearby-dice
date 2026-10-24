/** The scorecard: the sheet of the player whose turn it is, or one opened from the pills. */
import type { TFunction } from '@/i18n';
import {
  allowedCategories,
  Category,
  faceOf,
  gamePlayer,
  lowerCategories,
  luckyNumberOf,
  Ruleset,
  score,
  SHEET_FACTORS,
  UPPER_BONUS_THRESHOLD,
  UPPER_CATEGORIES,
  upperBonus,
  upperBonusPoints,
  upperSum,
} from '@/domain';
import type { Sheet } from '@/domain';
import { avatarOf } from '@/shared';
import type { AvatarView } from '@/shared';

import type { TurnContext } from './turnContext';

export enum CellState {
  /** Eingetragen: grey fill, check mark, final points. */
  Filled = 'filled',
  /** Wählbar: live preview on a primary tint. */
  Preview = 'preview',
  /** A preview of 0: same layout in red ("Streichen"). */
  PreviewZero = 'preview-zero',
  /** Noch offen: dashed border, "–". */
  Open = 'open',
}

export type CellView = {
  category: Category;
  label: string;
  /** Small second line, e.g. the fixed run of a Yatzy straight. */
  hint: string | null;
  /** Die face for the upper block; `null` for the lower-block illustrations. */
  face: number | null;
  state: CellState;
  value: string;
  pickable: boolean;
  accessibilityLabel: string;
};

export type BonusView = {
  label: string;
  /** "71 / 63": keeps counting past the threshold. */
  progress: string;
  /** 0–1; full once the threshold is reached. */
  fraction: number;
  reached: boolean;
};

export type SheetView = {
  title: string;
  owner: AvatarView;
  /** "×1 ×2 ×3" tabs with three sheets, otherwise `null`. */
  tabs: string[] | null;
  selectedTab: number;
  /**
   * The tab the player whose turn it is has open, when that is someone else: it gets a
   * marker in their colour. `null` on my turn and with a single sheet.
   */
  turnTab: { index: number; label: string } | null;
  /** Only the player whose turn it is switches sheets; everyone else follows along. */
  tabsEnabled: boolean;
  /** The selected field: mine, or the one the player whose turn it is has selected. */
  focused: Category | null;
  upper: CellView[];
  lower: CellView[];
  /** The upper-block bonus; `null` when the rules switch it off. */
  bonus: BonusView | null;
};

/** The sheet of the player whose turn it is, with previews of the dice on screen. */
export function buildSheet(t: TFunction, ctx: TurnContext): SheetView {
  const { myTurn, turnPlayer } = ctx;
  const sheets = gamePlayer(ctx.game, ctx.turn.playerId)!.sheets;
  const selectedTab = sheetIndexOf(ctx, sheets.length);
  const blocks = blocksOf(t, ctx, sheets[selectedTab], showsPreviews(ctx));

  return {
    title: myTurn ? t('game.mySheet') : t('game.sheetOf', { name: turnPlayer.name }),
    owner: avatarOf(turnPlayer),
    tabs: tabsOf(t, sheets.length),
    selectedTab,
    turnTab:
      !myTurn && sheets.length > 1
        ? { index: selectedTab, label: t('game.onSheet', { name: turnPlayer.name }) }
        : null,
    tabsEnabled: myTurn,
    focused: focusedCategory(ctx, [...blocks.upper, ...blocks.lower]),
    ...blocks,
  };
}

/**
 * Another player's sheet, opened from the pills: only their entries, no previews, and
 * its tabs turn on this phone alone.
 */
export function buildViewedSheet(
  t: TFunction,
  ctx: TurnContext,
  viewed: NonNullable<TurnContext['viewed']>,
): SheetView {
  const { player } = viewed;
  const sheets = gamePlayer(ctx.game, player.id)!.sheets;
  const selectedTab = Math.min(viewed.sheetIndex, sheets.length - 1);

  return {
    title:
      player.id === ctx.snapshot.myId
        ? t('game.mySheet')
        : t('game.sheetOf', { name: player.name }),
    owner: avatarOf(player),
    tabs: tabsOf(t, sheets.length),
    selectedTab,
    turnTab: null,
    tabsEnabled: true,
    focused: null,
    ...blocksOf(t, ctx, sheets[selectedTab], false),
  };
}

/** "×1 ×2 ×3" with three sheets, otherwise `null`. */
function tabsOf(t: TFunction, sheetCount: number): string[] | null {
  return sheetCount > 1
    ? SHEET_FACTORS.slice(0, sheetCount).map((factor) => t('game.sheetFactor', { factor }))
    : null;
}

/** Both blocks of one sheet and its bonus; `previews` shows what the dice on screen score. */
function blocksOf(
  t: TFunction,
  ctx: TurnContext,
  sheet: Sheet,
  previews: boolean,
): Pick<SheetView, 'upper' | 'lower' | 'bonus'> {
  const cell = (category: Category) => cellView(t, ctx, sheet, category, previews);

  return {
    upper: UPPER_CATEGORIES.map(cell),
    lower: lowerCategories(ctx.rules).map(cell),
    bonus: bonusOf(t, ctx, sheet),
  };
}

/** The cell of the selected field, if there is one. */
export function focusedCellOf(sheet: SheetView): CellView | null {
  if (sheet.focused === null) return null;

  return [...sheet.upper, ...sheet.lower].find((cell) => cell.category === sheet.focused) ?? null;
}

/**
 * On my turn the tab I chose. On someone else's turn the sheet they have open (hosts from
 * before the page was shared only send it with a selection).
 */
function sheetIndexOf(ctx: TurnContext, sheetCount: number): number {
  const theirs = ctx.turn.focus?.sheet ?? ctx.turn.page ?? 0;

  return Math.min(ctx.myTurn ? ctx.local.sheetIndex : theirs, sheetCount - 1);
}

/** Previews follow the dice on screen: while they shake, the last roll's stay up. */
const showsPreviews = (ctx: TurnContext) => ctx.local.shownRolled && ctx.turnPlayerHere && ctx.live;

const canPick = (ctx: TurnContext) => showsPreviews(ctx) && ctx.myTurn && !ctx.local.rolling;

const isPreview = (cell: CellView) =>
  cell.state === CellState.Preview || cell.state === CellState.PreviewZero;

/**
 * With a field selected, the dice on screen are what gets scored. Other phones show the
 * selection too, as long as they show its preview.
 */
function focusedCategory(ctx: TurnContext, cells: CellView[]): Category | null {
  const focused = cells.find((cell) =>
    ctx.myTurn
      ? cell.category === ctx.local.selectedCategory && cell.pickable
      : cell.category === ctx.turn.focus?.category && isPreview(cell),
  );

  return focused?.category ?? null;
}

/**
 * Yatzy straights are fixed runs, unlike Classic's "any four/five in a row".
 * Classic XL names its new fields by the dice they need.
 */
const HINT: Record<Ruleset, Partial<Record<Category, string>>> = {
  [Ruleset.Classic]: {},
  [Ruleset.ClassicXl]: {
    [Category.Even]: '2·4·6',
    [Category.Odd]: '1·3·5',
    [Category.Mini]: '≤\u00A010',
  },
  [Ruleset.Yatzy]: {
    [Category.SmallStraight]: '1-2-3-4-5',
    [Category.LargeStraight]: '2-3-4-5-6',
  },
};

/** An open "Glückszahl" field shows the sum to hit this round. */
function cellHint(
  t: TFunction,
  ctx: TurnContext,
  category: Category,
  open: boolean,
): string | null {
  if (category !== Category.LuckyNumber) return HINT[ctx.rules.ruleset][category] ?? null;
  const lucky = luckyNumberOf(ctx.game);

  return open && lucky !== null ? t('game.luckyNumberHint', { n: lucky }) : null;
}

function cellView(
  t: TFunction,
  ctx: TurnContext,
  sheet: Sheet,
  category: Category,
  previews: boolean,
): CellView {
  const { rules } = ctx;
  const dice = ctx.local.shownDice;
  const filled = sheet.fields[category];
  const open = filled === null || filled === undefined;
  const hint = cellHint(t, ctx, category, open);
  const name = t(`labels.category.${category}`);
  const label = hint ? `${name} (${hint})` : name;
  const base = {
    category,
    label: name,
    hint,
    face: faceOf(category) ?? null,
  };

  if (!open) {
    return {
      ...base,
      state: CellState.Filled,
      value: String(filled),
      pickable: false,
      accessibilityLabel: t('game.cell.filled', { label, count: filled }),
    };
  }

  const allowed = previews && allowedCategories(dice, sheet, rules).includes(category);
  if (!allowed) {
    return {
      ...base,
      state: CellState.Open,
      value: '–',
      pickable: false,
      accessibilityLabel: t('game.cell.open', { label }),
    };
  }

  const points = score(dice, category, sheet, rules, luckyNumberOf(ctx.game));
  const pickable = canPick(ctx);

  return {
    ...base,
    state: points === 0 ? CellState.PreviewZero : CellState.Preview,
    value: String(points),
    pickable,
    accessibilityLabel: pickable
      ? t('game.cell.pickable', { label, count: points })
      : t('game.cell.preview', { label, count: points }),
  };
}

/** `null` when the rules switch the upper-block bonus off. */
function bonusOf(t: TFunction, ctx: TurnContext, sheet: Sheet): BonusView | null {
  if (!ctx.rules.upperBonus) return null;
  const upper = upperSum(sheet);

  return {
    label: t('game.bonus', { points: upperBonusPoints(ctx.rules.ruleset) }),
    progress: t('game.bonusProgress', { sum: upper, threshold: UPPER_BONUS_THRESHOLD }),
    fraction: Math.min(1, upper / UPPER_BONUS_THRESHOLD),
    reached: upperBonus(sheet, ctx.rules) > 0,
  };
}
