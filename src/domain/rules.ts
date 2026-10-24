import { FieldOrder, GameLength, Ruleset, StartingPlayer } from './enums';

/** Every value a preset may use; the types and message validation use them. */
export const ROLLS_PER_TURN = [2, 3, 4] as const;
export const SECONDS_PER_TURN = [0, 30, 60] as const;
export const SHEET_COUNTS = [1, 3] as const;

export type RollsPerTurn = (typeof ROLLS_PER_TURN)[number];
export type SecondsPerTurn = (typeof SECONDS_PER_TURN)[number];
export type SheetCount = (typeof SHEET_COUNTS)[number];

export type Rules = {
  ruleset: Ruleset;
  rollsPerTurn: RollsPerTurn;
  /** 0 = no limit. */
  secondsPerTurn: SecondsPerTurn;
  /** Every player gets the same roll results in a round. */
  sameDice: boolean;
  /** +35 (classic family) or +50 (Yatzy) once the upper block reaches 63. */
  upperBonus: boolean;
  /** Adds the "Glückszahl" field: a new target sum every round. */
  luckyNumber: boolean;
  length: GameLength;
  /** Sheets per player; with three, they count ×1, ×2 and ×3. */
  sheets: SheetCount;
  fieldOrder: FieldOrder;
  startingPlayer: StartingPlayer;
};

export const DEFAULT_RULES: Rules = {
  ruleset: Ruleset.Classic,
  rollsPerTurn: 3,
  secondsPerTurn: 0,
  sameDice: false,
  upperBonus: true,
  luckyNumber: false,
  length: GameLength.Full,
  sheets: 1,
  fieldOrder: FieldOrder.Free,
  startingPlayer: StartingPlayer.Random,
};

export enum PresetId {
  Classic = 'classic',
  TopToBottom = 'top-to-bottom',
  Blitz = 'blitz',
  SameDice = 'same-dice',
  Triple = 'triple',
  Yatzy = 'yatzy',
  ClassicXl = 'classic-xl',
  LuckyNumber = 'lucky-number',
}

export const PRESETS: Record<PresetId, Rules> = {
  [PresetId.Classic]: DEFAULT_RULES,
  [PresetId.TopToBottom]: {
    ...DEFAULT_RULES,
    fieldOrder: FieldOrder.TopToBottom,
    secondsPerTurn: 60,
  },
  [PresetId.Blitz]: {
    ...DEFAULT_RULES,
    length: GameLength.Short,
    secondsPerTurn: 30,
  },
  [PresetId.SameDice]: { ...DEFAULT_RULES, sameDice: true },
  [PresetId.Triple]: { ...DEFAULT_RULES, sheets: 3 },
  [PresetId.Yatzy]: { ...DEFAULT_RULES, ruleset: Ruleset.Yatzy },
  [PresetId.ClassicXl]: { ...DEFAULT_RULES, ruleset: Ruleset.ClassicXl },
  [PresetId.LuckyNumber]: { ...DEFAULT_RULES, luckyNumber: true },
};

/** Display order of the presets on the host setup screen. */
export const PRESET_ORDER: readonly PresetId[] = [
  PresetId.Classic,
  PresetId.TopToBottom,
  PresetId.Blitz,
  PresetId.SameDice,
  PresetId.Triple,
  PresetId.Yatzy,
  PresetId.ClassicXl,
  PresetId.LuckyNumber,
];

/** Presets offered for Training; "same dice" only makes a difference with others. */
export const TRAINING_PRESET_ORDER: readonly PresetId[] = PRESET_ORDER.filter(
  (id) => id !== PresetId.SameDice,
);

const RULE_KEYS = Object.keys(DEFAULT_RULES) as (keyof Rules)[];

export function rulesEqual(a: Rules, b: Rules): boolean {
  return RULE_KEYS.every((key) => a[key] === b[key]);
}

/** The preset these rules match exactly, or `null` for rules no preset uses. */
export function matchPreset(rules: Rules): PresetId | null {
  // Games from before the lucky-number rule have no `luckyNumber`; it was off.
  const known: Rules = { ...rules, luckyNumber: rules.luckyNumber === true };

  return PRESET_ORDER.find((id) => rulesEqual(PRESETS[id], known)) ?? null;
}

export const SHORT_GAME_TURNS = 6;
export const SHEET_FACTORS = [1, 2, 3] as const;
export const UPPER_BONUS_THRESHOLD = 63;

export function upperBonusPoints(ruleset: Ruleset): number {
  return ruleset === Ruleset.Yatzy ? 50 : 35;
}

/** Every further Yatzy adds this bonus, in every ruleset and preset. */
export const YATZY_BONUS = 50;

/** Each round's lucky number lies in this range (inclusive); hitting it exactly scores the points. */
export const LUCKY_NUMBER_MIN = 8;
export const LUCKY_NUMBER_MAX = 26;
export const LUCKY_NUMBER_POINTS = 40;

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
