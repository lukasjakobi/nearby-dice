/**
 * The facts every part of the game screen depends on, worked out once per snapshot:
 * whose turn it is, whether this phone can act, and what the dice on screen show.
 */
import { Link, rollsLeft } from '@/domain';
import type { Category, Dice, GameState, Rules, Turn } from '@/domain';
import { ConnectionStatus, playerById, SessionPhase } from '@/session';
import type { PlayerInfo, SessionSnapshot } from '@/session';

/** A sheet this phone opened by tapping a player's pill; nothing about it is shared. */
export type ViewedSheet = { playerId: string; sheetIndex: number };

/** Screen-local state the builder needs besides the snapshot. */
export type LocalState = {
  /** Which of the three sheets is shown. */
  sheetIndex: number;
  /** Another player's sheet opened from the pills; `null` follows the turn. */
  viewed: ViewedSheet | null;
  /** Dice as currently drawn (they change after the shake). */
  shownDice: Dice;
  /** The shown dice come from a roll in this turn (the old roll while shaking). */
  shownRolled: boolean;
  rolling: boolean;
  rollPending: boolean;
  /** My score was sent and its confirmation has not arrived yet. */
  scorePending: boolean;
  /** The field I selected to score (not yet confirmed), if any. */
  selectedCategory: Category | null;
};

export type TurnContext = {
  snapshot: SessionSnapshot;
  local: LocalState;
  game: GameState;
  rules: Rules;
  turn: Turn;
  /** The player whose turn it is. */
  turnPlayer: PlayerInfo;
  /**
   * The other player whose sheet I opened, while they are still in the game; `null` shows
   * the sheet of the player whose turn it is.
   */
  viewed: { player: PlayerInfo; sheetIndex: number } | null;
  myTurn: boolean;
  /** This phone is connected to the round. */
  connected: boolean;
  /** The game is running: no countdown, not finished. */
  playing: boolean;
  /** Connected and playing: moves from this phone count. */
  live: boolean;
  /** The player whose turn it is is connected, so their moves arrive. */
  turnPlayerHere: boolean;
  /** At least one roll this turn. */
  rolled: boolean;
  rollsLeft: number;
};

export function turnContext(snapshot: SessionSnapshot, local: LocalState): TurnContext | null {
  const game = snapshot.shared.game;
  if (!game) return null;
  const { turn } = game;
  const turnPlayer = playerById(snapshot, turn.playerId)!;
  const connected = snapshot.connection.status === ConnectionStatus.Connected;
  const playing = snapshot.shared.phase === SessionPhase.Playing;

  return {
    snapshot,
    local,
    game,
    rules: game.rules,
    turn,
    turnPlayer,
    viewed: viewedOf(snapshot, game, local.viewed),
    myTurn: turn.playerId === snapshot.myId,
    connected,
    playing,
    live: connected && playing,
    turnPlayerHere: turnPlayer.link === Link.Connected,
    rolled: turn.rollsUsed > 0,
    rollsLeft: rollsLeft(game),
  };
}

/** Opening the turn player's sheet, or a removed player's, just follows the turn. */
function viewedOf(
  snapshot: SessionSnapshot,
  game: GameState,
  viewed: ViewedSheet | null,
): TurnContext['viewed'] {
  if (!viewed || viewed.playerId === game.turn.playerId) return null;
  if (!game.turnOrder.includes(viewed.playerId)) return null;
  const player = playerById(snapshot, viewed.playerId);

  return player && player.link !== Link.Removed ? { player, sheetIndex: viewed.sheetIndex } : null;
}

/** Tells one turn from the next, also across games; `null` without a game. */
export function turnKey(game: GameState | null, gameNumber: number): string | null {
  if (!game) return null;
  const turnsTaken = game.players.find((p) => p.id === game.turn.playerId)?.turnsTaken;

  return `${gameNumber}:${game.turn.playerId}:${turnsTaken}`;
}
