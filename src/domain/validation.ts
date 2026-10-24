/**
 * Shape checks for untrusted game data: network messages and what was stored on the phone.
 * Each check only answers whether a value has the expected shape and allowed values.
 */
import { Category, FieldOrder, GameLength, Ruleset, StartingPlayer } from './enums';
import { gamePlayer, HistoryKind } from './engine';
import type { GameState } from './engine';
import { isPlayerColor, NAME_MAX_LENGTH } from './player';
import type { NamedPlayer } from './player';
import {
  matchPreset,
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROLLS_PER_TURN,
  SECONDS_PER_TURN,
  SHEET_COUNTS,
} from './rules';
import type { Rules } from './rules';
import { categoriesFor } from './sheet';
import type { ModeStats, SavedGame } from './stats';

const values = <T extends Record<string, string>>(value: T): string[] => Object.values(value);
const categories = values(Category);
const rulesets = values(Ruleset);
const historyKinds = values(HistoryKind);
const fieldOrders = values(FieldOrder);
const gameLengths = values(GameLength);
const startingPlayers = values(StartingPlayer);

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown, max = 128, min = 1): value is string {
  return (
    typeof value === 'string' &&
    value.length >= min &&
    value.length <= max &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

export function isInteger(value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
}

export function isFiniteTimestamp(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    Math.abs(value) <= 8_640_000_000_000_000
  );
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isOneOf(value: unknown, list: readonly string[]): boolean {
  return typeof value === 'string' && list.includes(value);
}

/** A selected field: `null` for none. */
export function isFocus(value: unknown): boolean {
  return (
    value === null ||
    (isRecord(value) && isOneOf(value.category, categories) && isInteger(value.sheet, 0, 2))
  );
}

export function isRules(value: unknown): value is Rules {
  return (
    isRecord(value) &&
    isOneOf(value.ruleset, rulesets) &&
    (ROLLS_PER_TURN as readonly number[]).includes(value.rollsPerTurn as number) &&
    (SECONDS_PER_TURN as readonly number[]).includes(value.secondsPerTurn as number) &&
    isBoolean(value.sameDice) &&
    isBoolean(value.upperBonus) &&
    // Optional: hosts from before the lucky-number rule do not send it.
    (value.luckyNumber === undefined || isBoolean(value.luckyNumber)) &&
    isOneOf(value.length, gameLengths) &&
    (SHEET_COUNTS as readonly number[]).includes(value.sheets as number) &&
    isOneOf(value.fieldOrder, fieldOrders) &&
    isOneOf(value.startingPlayer, startingPlayers)
  );
}

function isSheet(value: unknown, rules: Rules): boolean {
  if (!isRecord(value) || !isInteger(value.extraYatzys, 0, 1000) || !isRecord(value.fields))
    return false;
  const allowed: string[] = categoriesFor(rules);
  const fields = value.fields;

  return (
    Object.keys(fields).length === allowed.length &&
    allowed.every((category) => Object.prototype.hasOwnProperty.call(fields, category)) &&
    Object.entries(fields).every(
      ([key, score]) => allowed.includes(key) && (score === null || isInteger(score, 0, 1000)),
    )
  );
}

function isGamePlayer(value: unknown, rules: Rules): boolean {
  return (
    isRecord(value) &&
    isString(value.id) &&
    Array.isArray(value.sheets) &&
    value.sheets.length === rules.sheets &&
    value.sheets.every((sheet) => isSheet(sheet, rules)) &&
    isInteger(value.turnsTaken, 0, 1000) &&
    isBoolean(value.removed)
  );
}

function isHistoryEntry(value: unknown, rules: Rules): boolean {
  if (
    !isRecord(value) ||
    !isInteger(value.seq, 1, 20_000) ||
    !isString(value.playerId) ||
    !isInteger(value.round, 1, 1000) ||
    !isOneOf(value.kind, historyKinds)
  )
    return false;
  if (value.kind === HistoryKind.Skipped || value.kind === HistoryKind.Removed) return true;

  return (
    categoriesFor(rules).includes(value.category as Category) &&
    isInteger(value.sheet, 0, rules.sheets - 1) &&
    isInteger(value.points, 0, 1000) &&
    isDice(value.dice, true)
  );
}

function isDice(value: unknown, rolledOnly = false): boolean {
  return (
    Array.isArray(value) &&
    value.length === 5 &&
    value.every((die) => isInteger(die, rolledOnly ? 1 : 0, 6))
  );
}

/** A complete multiplayer game: rules, every sheet, the turn and the whole history. */
export function isGameState(value: unknown): value is GameState {
  if (
    !isRecord(value) ||
    !isRules(value.rules) ||
    !isInteger(value.seed, -Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER) ||
    !Array.isArray(value.players) ||
    value.players.length < MIN_PLAYERS ||
    value.players.length > MAX_PLAYERS ||
    !Array.isArray(value.turnOrder) ||
    value.turnOrder.length !== value.players.length ||
    !isRecord(value.turn) ||
    !isBoolean(value.finished) ||
    !Array.isArray(value.history) ||
    value.history.length > 20_000 ||
    !isInteger(value.rev, 0)
  )
    return false;
  const rules = value.rules;
  const players = value.players;
  if (!players.every((player) => isGamePlayer(player, rules))) return false;
  const ids = players.map((player) => (player as Record<string, unknown>).id as string);
  if (
    new Set(ids).size !== ids.length ||
    !value.turnOrder.every((id) => isString(id) && ids.includes(id)) ||
    new Set(value.turnOrder).size !== ids.length ||
    !value.history.every(
      (entry, index) =>
        isHistoryEntry(entry, rules) && (entry as Record<string, unknown>).seq === index + 1,
    )
  )
    return false;
  const turn = value.turn;
  if (
    !isString(turn.playerId) ||
    !ids.includes(turn.playerId) ||
    !isInteger(turn.rollsUsed, 0, rules.rollsPerTurn) ||
    !isDice(turn.dice, turn.rollsUsed > 0) ||
    (turn.rollsUsed === 0 && (!Array.isArray(turn.dice) || !turn.dice.every((die) => die === 0))) ||
    !Array.isArray(turn.held) ||
    turn.held.length !== 5 ||
    !turn.held.every(isBoolean) ||
    !isInteger(turn.rollSeq, 0) ||
    !(turn.deadline === null || isFiniteTimestamp(turn.deadline)) ||
    !isFocus(turn.focus) ||
    // Optional: hosts from before the page was shared do not send it.
    !(turn.page === undefined || isInteger(turn.page, 0, rules.sheets - 1))
  )
    return false;

  return value.history.every((entry) =>
    ids.includes((entry as Record<string, unknown>).playerId as string),
  );
}

export function isModeStats(value: unknown): value is ModeStats {
  return (
    isRecord(value) && isInteger(value.wins) && isInteger(value.best) && isInteger(value.yatzys)
  );
}

export function isNamedPlayer(value: unknown): value is NamedPlayer {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name, NAME_MAX_LENGTH) &&
    isPlayerColor(value.color)
  );
}

/**
 * A finished game in one of the presets whose players match its sheets, played from a seat
 * that was never removed.
 */
export function isSavedGame(value: unknown): value is SavedGame {
  if (
    !isRecord(value) ||
    !isString(value.id, 256) ||
    !isInteger(value.playedAt) ||
    !isString(value.myId) ||
    !Array.isArray(value.players) ||
    !value.players.every(isNamedPlayer) ||
    !isGameState(value.game) ||
    !value.game.finished ||
    matchPreset(value.game.rules) === null
  )
    return false;
  const { players, game } = value;
  const me = gamePlayer(game, value.myId);

  return (
    me !== undefined &&
    !me.removed &&
    players.length === game.players.length &&
    game.players.every((player) => players.some((named) => named.id === player.id))
  );
}
