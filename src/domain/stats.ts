/**
 * What this phone keeps about the games played on it: the last saved games, lifetime totals per
 * preset and the Training best. These functions decide how a finished game changes them.
 */
import { gamePlayer, ranking } from './engine';
import type { GameState, PlayerId } from './engine';
import type { NamedPlayer } from './player';
import { matchPreset } from './rules';
import type { PresetId } from './rules';
import { yatzyCount } from './totals';

/** A finished multiplayer game, kept whole so it can be opened again from the start screen. */
export type SavedGame = {
  /** sessionId + game number; each game is saved once. */
  id: string;
  playedAt: number;
  /** The player on this phone. */
  myId: PlayerId;
  /** Everyone in the game, including players the host removed. */
  players: NamedPlayer[];
  /** The final state: every player's sheets, the rules and the whole history. */
  game: GameState;
};

export type ModeStats = { wins: number; best: number; yatzys: number };

/** A finished Training game; kept apart from the multiplayer statistics. */
export type TrainingResult = { id: string; points: number };

export type Stats = {
  /** Per-preset lifetime stats; a preset with no games played yet has no entry. */
  modes: Partial<Record<PresetId, ModeStats>>;
  /** The newest saved games first; the oldest is dropped once the limit is reached. */
  recent: SavedGame[];
  /** Highest Training score, and the game that set it. */
  trainingBest: number;
  trainingBestId: string | null;
};

export const SAVED_GAMES_LIMIT = 10;
export const ZERO_MODE_STATS: ModeStats = { wins: 0, best: 0, yatzys: 0 };
export const EMPTY_STATS: Stats = { modes: {}, recent: [], trainingBest: 0, trainingBestId: null };

/**
 * Saves a finished game and adds it to its preset's totals. Returns `stats` itself for a game
 * that is already saved, uses rules no preset uses, or was played from a removed seat.
 */
export function recordGame(stats: Stats, saved: SavedGame): Stats {
  const { game, myId } = saved;
  // A removed seat has no placement.
  const mine = ranking(game).find((placement) => placement.playerId === myId);
  const presetId = matchPreset(game.rules);
  if (!mine || presetId === null || stats.recent.some((r) => r.id === saved.id)) return stats;
  const previous = stats.modes[presetId] ?? ZERO_MODE_STATS;
  const yatzys = yatzyCount(gamePlayer(game, myId)!.sheets);

  return {
    ...stats,
    modes: {
      ...stats.modes,
      [presetId]: {
        wins: previous.wins + (mine.winner ? 1 : 0),
        best: Math.max(previous.best, mine.total),
        yatzys: previous.yatzys + yatzys,
      },
    },
    recent: [saved, ...stats.recent].slice(0, SAVED_GAMES_LIMIT),
  };
}

/** Keeps the higher Training score; returns `stats` itself when the best still stands. */
export function recordTraining(stats: Stats, { id, points }: TrainingResult): Stats {
  return points > stats.trainingBest
    ? { ...stats, trainingBest: points, trainingBestId: id }
    : stats;
}
