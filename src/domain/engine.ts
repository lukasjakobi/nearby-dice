/**
 * The authoritative game state machine. The host feeds every move through `reduce`;
 * guests only render the state it produces. Pure: randomness and time are passed in.
 *
 * The engine knows players only by id. Names, colours and connection state belong
 * to the session layer.
 */
import { StartingPlayer } from './enums';
import type { Category } from './enums';
import { autoPick } from './autopick';
import { mixSeed, rollDie, seededRng } from './random';
import type { Rng } from './random';
import { LUCKY_NUMBER_MAX, LUCKY_NUMBER_MIN } from './rules';
import type { Rules } from './rules';
import { allowedCategories, playerTotal, score, writeScore } from './scoring';
import type { Dice } from './scoring';
import { emptySheet, turnsPerPlayer } from './sheet';
import type { Sheet } from './sheet';

export type PlayerId = string;
export type Held = readonly [boolean, boolean, boolean, boolean, boolean];
/** A field the player has selected but not entered yet. */
export type Focus = { category: Category; sheet: number };

export type GamePlayer = {
  id: PlayerId;
  sheets: Sheet[];
  turnsTaken: number;
  /** Removed by the host; out of the ranking and the turn order. */
  removed: boolean;
};

export type Turn = {
  playerId: PlayerId;
  rollsUsed: number;
  dice: Dice;
  held: Held;
  /** Increments with every roll, so every device knows when to animate. */
  rollSeq: number;
  /** Host clock in ms; only with a time limit. */
  deadline: number | null;
  /** The selected field, so every phone can show it before it is entered. Cleared by a roll. */
  focus: Focus | null;
  /** The sheet the player has open, so every phone can follow along. 0 at turn start. */
  page: number;
};

export enum HistoryKind {
  /** A field was written by the player. */
  Scored = 'scored',
  /** A field was written by the timeout rule. */
  AutoScored = 'auto-scored',
  /** The host skipped a lost player's turn. */
  Skipped = 'skipped',
  /** The host removed a player from the game. */
  Removed = 'removed',
}

type HistoryBase = {
  /** 1-based position in the history; devices use it to show one toast per entry. */
  seq: number;
  playerId: PlayerId;
  /** The player's turn number (1-based) the entry belongs to. */
  round: number;
};

export type ScoreEntry = HistoryBase & {
  kind: HistoryKind.Scored | HistoryKind.AutoScored;
  category: Category;
  sheet: number;
  points: number;
  dice: Dice;
};

export type HistoryEntry =
  ScoreEntry | (HistoryBase & { kind: HistoryKind.Skipped | HistoryKind.Removed });

export type GameState = {
  rules: Rules;
  seed: number;
  players: GamePlayer[];
  turnOrder: PlayerId[];
  turn: Turn;
  finished: boolean;
  /** Everything that happened, oldest first. Every device holds the full list. */
  history: HistoryEntry[];
  /** Increments with every change; guests ignore older states. */
  rev: number;
};

export enum ActionType {
  Roll = 'roll',
  Hold = 'hold',
  Score = 'score',
  Focus = 'focus',
  ViewSheet = 'view-sheet',
  Timeout = 'timeout',
  Skip = 'skip',
  Remove = 'remove',
}

export type GameAction =
  | { type: ActionType.Roll; by: PlayerId }
  | { type: ActionType.Hold; by: PlayerId; held: Held }
  | { type: ActionType.Score; by: PlayerId; category: Category; sheet: number }
  | { type: ActionType.Focus; by: PlayerId; focus: Focus | null }
  | { type: ActionType.ViewSheet; by: PlayerId; sheet: number }
  | { type: ActionType.Timeout }
  | { type: ActionType.Skip; playerId: PlayerId }
  | { type: ActionType.Remove; playerId: PlayerId };

/** Moves a player may send over the network. */
export type PlayerAction = Extract<GameAction, { by: PlayerId }>;

export enum RejectReason {
  Finished = 'finished',
  NotYourTurn = 'not-your-turn',
  NoRollsLeft = 'no-rolls-left',
  NotRolled = 'not-rolled',
  CannotHold = 'cannot-hold',
  UnknownSheet = 'unknown-sheet',
  FieldNotAllowed = 'field-not-allowed',
  NotCurrentPlayer = 'not-current-player',
}

export type ReduceContext = { now: number; rng: Rng };
export type ReduceResult = { state: GameState; rejected?: RejectReason };

export const NO_DICE: Dice = [0, 0, 0, 0, 0];
export const NO_HOLD: Held = [false, false, false, false, false];

export function createGame(opts: {
  rules: Rules;
  /** Lobby order; the turn order follows it. */
  playerIds: PlayerId[];
  hostId: PlayerId;
  seed: number;
  ctx: ReduceContext;
}): GameState {
  const { rules, playerIds, ctx } = opts;
  const startIndex =
    rules.startingPlayer === StartingPlayer.Host
      ? Math.max(0, playerIds.indexOf(opts.hostId))
      : Math.floor(ctx.rng() * playerIds.length);
  const turnOrder = [...playerIds.slice(startIndex), ...playerIds.slice(0, startIndex)];

  return {
    rules,
    seed: opts.seed,
    players: playerIds.map((id) => ({
      id,
      sheets: Array.from({ length: rules.sheets }, () => emptySheet(rules)),
      turnsTaken: 0,
      removed: false,
    })),
    turnOrder,
    turn: newTurn(turnOrder[0], rules, ctx.now, 0),
    finished: false,
    history: [],
    rev: 1,
  };
}

function newTurn(playerId: PlayerId, rules: Rules, now: number, rollSeq: number): Turn {
  return {
    playerId,
    rollsUsed: 0,
    dice: NO_DICE,
    held: NO_HOLD,
    rollSeq,
    deadline: rules.secondsPerTurn > 0 ? now + rules.secondsPerTurn * 1000 : null,
    focus: null,
    page: 0,
  };
}

export function gamePlayer(state: GameState, id: PlayerId): GamePlayer | undefined {
  return state.players.find((player) => player.id === id);
}

export function totalOf(state: GameState, id: PlayerId): number {
  const player = gamePlayer(state, id);

  return player ? playerTotal(player.sheets, state.rules) : 0;
}

export function rollsLeft(state: GameState): number {
  return state.rules.rollsPerTurn - state.turn.rollsUsed;
}

/** "Runde n": the active player's current turn number. */
export function currentRound(state: GameState): number {
  const taken = gamePlayer(state, state.turn.playerId)?.turnsTaken ?? 0;

  return Math.min(turnsPerPlayer(state.rules), taken + 1);
}

/** Round `round`'s lucky number: the same for every player, derived from the host's seed. */
export function luckyNumberFor(seed: number, round: number): number {
  const span = LUCKY_NUMBER_MAX - LUCKY_NUMBER_MIN + 1;

  return LUCKY_NUMBER_MIN + Math.floor(seededRng(mixSeed(seed, round, span))() * span);
}

/** The lucky number of the current turn, or `null` without the lucky-number rule. */
export function luckyNumberOf(state: GameState): number | null {
  return state.rules.luckyNumber ? luckyNumberFor(state.seed, currentRound(state)) : null;
}

function isDone(player: GamePlayer, rules: Rules): boolean {
  return player.removed || player.turnsTaken >= turnsPerPlayer(rules);
}

export function lastEntry(state: GameState): HistoryEntry | null {
  return state.history[state.history.length - 1] ?? null;
}

/**
 * `to` is `from` later in the same turn. Every roll moves `rollSeq` and `rollsUsed`
 * together, so any other difference means an entry or skip passed the turn on.
 */
export function sameTurn(from: Turn, to: Turn): boolean {
  return (
    from.playerId === to.playerId &&
    to.rollsUsed >= from.rollsUsed &&
    to.rollSeq - from.rollSeq === to.rollsUsed - from.rollsUsed
  );
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type NewEntry = DistributiveOmit<HistoryEntry, 'seq' | 'round'>;

function withEntry(state: GameState, entry: NewEntry): HistoryEntry[] {
  const round = (gamePlayer(state, entry.playerId)?.turnsTaken ?? 0) + 1;

  return [...state.history, { ...entry, seq: state.history.length + 1, round } as HistoryEntry];
}

function next(state: GameState, patch: Partial<GameState>): GameState {
  return { ...state, ...patch, rev: state.rev + 1 };
}

function mapPlayer(state: GameState, id: PlayerId, fn: (p: GamePlayer) => GamePlayer) {
  return state.players.map((player) => (player.id === id ? fn(player) : player));
}

/** Passes the turn to the next player in turn order who still has turns left. */
function passTurn(state: GameState, ctx: ReduceContext): GameState {
  const { turnOrder } = state;
  const stillPlaying = (id: PlayerId) => !isDone(gamePlayer(state, id)!, state.rules);
  if (!turnOrder.some(stillPlaying)) {
    return next(state, {
      finished: true,
      turn: {
        ...state.turn,
        rollsUsed: 0,
        dice: NO_DICE,
        held: NO_HOLD,
        deadline: null,
        focus: null,
      },
    });
  }

  const from = turnOrder.indexOf(state.turn.playerId);
  for (let step = 1; step <= turnOrder.length; step++) {
    const candidate = turnOrder[(from + step) % turnOrder.length];
    if (stillPlaying(candidate)) {
      return next(state, { turn: newTurn(candidate, state.rules, ctx.now, state.turn.rollSeq) });
    }
  }

  return state; // unreachable: someone is still playing
}

/** With "same dice", round n and roll k give every player the same sequence. */
function rollDice(state: GameState, ctx: ReduceContext): Dice {
  const { turn, rules } = state;
  const round = gamePlayer(state, turn.playerId)!.turnsTaken;
  const rng = rules.sameDice ? seededRng(mixSeed(state.seed, round, turn.rollsUsed)) : ctx.rng;

  return turn.dice.map((die, i) => {
    const fresh = rollDie(rng);

    return turn.rollsUsed > 0 && turn.held[i] ? die : fresh;
  }) as unknown as Dice;
}

function applyRoll(state: GameState, ctx: ReduceContext): GameState {
  const { turn } = state;

  return next(state, {
    turn: {
      ...turn,
      dice: rollDice(state, ctx),
      held: turn.rollsUsed === 0 ? NO_HOLD : turn.held,
      rollsUsed: turn.rollsUsed + 1,
      rollSeq: turn.rollSeq + 1,
      focus: null,
    },
  });
}

function applyScore(
  state: GameState,
  playerId: PlayerId,
  category: Category,
  sheetIndex: number,
  kind: HistoryKind.Scored | HistoryKind.AutoScored,
  ctx: ReduceContext,
): GameState {
  const { dice } = state.turn;
  const player = gamePlayer(state, playerId)!;
  const lucky = luckyNumberOf(state);
  const points = score(dice, category, player.sheets[sheetIndex], state.rules, lucky);
  const scored = next(state, {
    history: withEntry(state, { kind, playerId, category, sheet: sheetIndex, points, dice }),
    players: mapPlayer(state, playerId, (p) => ({
      ...p,
      sheets: p.sheets.map((sheet, i) =>
        i === sheetIndex ? writeScore(sheet, category, dice, state.rules, lucky) : sheet,
      ),
      turnsTaken: p.turnsTaken + 1,
    })),
  });

  return passTurn(scored, ctx);
}

export function reduce(state: GameState, action: GameAction, ctx: ReduceContext): ReduceResult {
  const reject = (rejected: RejectReason): ReduceResult => ({ state, rejected });
  if (state.finished) return reject(RejectReason.Finished);
  const { turn, rules } = state;
  if ('by' in action && action.by !== turn.playerId) return reject(RejectReason.NotYourTurn);

  switch (action.type) {
    case ActionType.Roll:
      if (turn.rollsUsed >= rules.rollsPerTurn) return reject(RejectReason.NoRollsLeft);

      return { state: applyRoll(state, ctx) };

    case ActionType.Hold:
      if (turn.rollsUsed === 0 || turn.rollsUsed >= rules.rollsPerTurn) {
        return reject(RejectReason.CannotHold);
      }

      return { state: next(state, { turn: { ...turn, held: action.held } }) };

    case ActionType.Score: {
      if (turn.rollsUsed === 0) return reject(RejectReason.NotRolled);
      const sheet = gamePlayer(state, action.by)?.sheets[action.sheet];
      if (!sheet) return reject(RejectReason.UnknownSheet);
      if (!allowedCategories(turn.dice, sheet, rules).includes(action.category)) {
        return reject(RejectReason.FieldNotAllowed);
      }

      return {
        state: applyScore(state, action.by, action.category, action.sheet, HistoryKind.Scored, ctx),
      };
    }

    case ActionType.Focus: {
      const { focus } = action;
      if (focus) {
        if (turn.rollsUsed === 0) return reject(RejectReason.NotRolled);
        const sheet = gamePlayer(state, action.by)?.sheets[focus.sheet];
        if (!sheet) return reject(RejectReason.UnknownSheet);
        if (!allowedCategories(turn.dice, sheet, rules).includes(focus.category)) {
          return reject(RejectReason.FieldNotAllowed);
        }
      }

      // A selected field is always on the open sheet.
      return { state: next(state, { turn: { ...turn, focus, page: focus?.sheet ?? turn.page } }) };
    }

    case ActionType.ViewSheet: {
      const { sheet } = action;
      if (!Number.isInteger(sheet) || sheet < 0 || sheet >= rules.sheets) {
        return reject(RejectReason.UnknownSheet);
      }

      if (sheet === turn.page) return { state };
      // A selection on the sheet being left is dropped with it.
      const focus = turn.focus?.sheet === sheet ? turn.focus : null;

      return { state: next(state, { turn: { ...turn, page: sheet, focus } }) };
    }

    case ActionType.Timeout: {
      const rolled = turn.rollsUsed === 0 ? applyRoll(state, ctx) : state;
      const player = gamePlayer(rolled, turn.playerId)!;
      const pick = autoPick(rolled.turn.dice, player.sheets, rules, luckyNumberOf(rolled));
      if (!pick) return { state: passTurn(rolled, ctx) };

      return {
        state: applyScore(
          rolled,
          player.id,
          pick.category,
          pick.sheet,
          HistoryKind.AutoScored,
          ctx,
        ),
      };
    }

    case ActionType.Skip:
      if (action.playerId !== turn.playerId) return reject(RejectReason.NotCurrentPlayer);
      const skipped = next(state, {
        history: withEntry(state, { kind: HistoryKind.Skipped, playerId: action.playerId }),
      });

      return { state: passTurn(skipped, ctx) };

    case ActionType.Remove: {
      const removed = next(state, {
        players: mapPlayer(state, action.playerId, (p) => ({ ...p, removed: true })),
        history: withEntry(state, { kind: HistoryKind.Removed, playerId: action.playerId }),
      });

      return { state: turn.playerId === action.playerId ? passTurn(removed, ctx) : removed };
    }
  }
}

export type Placement = { playerId: PlayerId; total: number; place: number; winner: boolean };

/** Highest total wins; equal totals share a place and keep turn order. */
export function ranking(state: GameState): Placement[] {
  const order = state.turnOrder;
  const rows = state.players
    .filter((player) => !player.removed)
    .map((player) => ({ playerId: player.id, total: playerTotal(player.sheets, state.rules) }))
    .sort((a, b) => b.total - a.total || order.indexOf(a.playerId) - order.indexOf(b.playerId));
  const top = rows[0]?.total ?? 0;
  let place = 0;
  let previous: number | null = null;

  return rows.map((row, i) => {
    if (row.total !== previous) place = i + 1;
    previous = row.total;

    return { ...row, place, winner: row.total === top };
  });
}
