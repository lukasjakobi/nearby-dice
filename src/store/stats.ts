import {
  EMPTY_STATS,
  isModeStats,
  isOneOf,
  isRecord,
  isSavedGame,
  PresetId,
  recordGame,
  recordTraining,
  SAVED_GAMES_LIMIT,
} from '@/domain';
import type { ModeStats, SavedGame, Stats, TrainingResult } from '@/domain';

import { createPersistedStore } from './createPersistedStore';
import { nonNegative } from './storage';

const presetIds: string[] = Object.values(PresetId);

function sanitizeStats(stored: Record<string, unknown>): Partial<Stats> {
  const state: Partial<Stats> = {};
  if (isRecord(stored.modes)) {
    const modes: Partial<Record<PresetId, ModeStats>> = {};
    for (const [id, stats] of Object.entries(stored.modes)) {
      if (isOneOf(id, presetIds) && isModeStats(stats)) modes[id as PresetId] = stats;
    }

    state.modes = modes;
  }

  if (nonNegative(stored.trainingBest)) state.trainingBest = stored.trainingBest;
  if (stored.trainingBestId === null || typeof stored.trainingBestId === 'string') {
    state.trainingBestId = stored.trainingBestId;
  }

  if (Array.isArray(stored.recent)) {
    // Rows from before games were saved whole have no sheets and are dropped here.
    state.recent = stored.recent.filter(isSavedGame).slice(0, SAVED_GAMES_LIMIT);
  }

  return state;
}

export const useStatsStore = createPersistedStore({
  key: 'nearbydice.stats.v1',
  defaults: EMPTY_STATS,
  sanitize: sanitizeStats,
  actions: (update) => ({
    /** Saves a finished game and adds it to the totals once; later calls with the same id are ignored. */
    record: (saved: SavedGame) => update((stats) => recordGame(stats, saved)),
    /** Keeps the Training best; calling it again for the same game changes nothing. */
    recordTraining: (result: TrainingResult) => update((stats) => recordTraining(stats, result)),
    reset: () => update(() => EMPTY_STATS),
  }),
});
