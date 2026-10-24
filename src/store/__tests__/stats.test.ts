import AsyncStorage from '@react-native-async-storage/async-storage';

import { matchPreset, PRESETS, PresetId, totalOf } from '@/domain';
import type { SavedGame } from '@/domain';
import { JONAS, LUKAS, ANTONIA, savedGame } from '@/test/fixtures';

import { useStatsStore } from '../stats';

const saved = (id: string, overrides: Partial<SavedGame> = {}) =>
  savedGame([LUKAS, ANTONIA, JONAS], ANTONIA, { id, ...overrides });
const PLAYED = saved('played').game;

function rehydrate(): Promise<void> {
  return new Promise((resolve) => {
    const unsubscribe = useStatsStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
    void useStatsStore.persist.rehydrate();
  });
}

test('recording the same game again writes nothing', () => {
  useStatsStore.getState().record(saved('session-1'));
  const setItem = jest.mocked(AsyncStorage.setItem);
  setItem.mockClear();

  useStatsStore.getState().record(saved('session-1'));

  expect(setItem).not.toHaveBeenCalled();
  expect(useStatsStore.getState().recent).toHaveLength(1);
});

test('hydration keeps saved games and drops summary rows, broken and custom-rules games', async () => {
  const valid = saved('session-3');
  await AsyncStorage.setItem(
    'nearbydice.stats.v1',
    JSON.stringify({
      state: {
        modes: {},
        recent: [
          valid,
          // A row from before games were saved whole.
          { id: 'session-2', place: 1, points: 210, opponents: ['Lukas'], playedAt: 1 },
          saved('session-1', { players: [] }),
          saved('session-0', { game: { ...PLAYED, finished: false } }),
          // Rules no preset uses ("Weitere Regeln" from older versions).
          saved('session-x', { game: { ...PLAYED, rules: { ...PLAYED.rules, rollsPerTurn: 2 } } }),
        ],
        trainingBest: 0,
        trainingBestId: null,
      },
      version: 0,
    }),
  );

  await rehydrate();

  expect(useStatsStore.getState().recent).toEqual([valid]);
});

test('a game saved before fullHouseFromFiveOfAKind was removed still loads and matches its preset', async () => {
  // Older phones stored the option as `false`; no preset used it, so the game keeps its preset.
  const legacyRules = { ...PLAYED.rules, fullHouseFromFiveOfAKind: false };
  const legacy = saved('session-legacy', { game: { ...PLAYED, rules: legacyRules } });
  await AsyncStorage.setItem(
    'nearbydice.stats.v1',
    JSON.stringify({
      state: { modes: {}, recent: [legacy], trainingBest: 0, trainingBestId: null },
      version: 0,
    }),
  );

  await rehydrate();

  const [loaded] = useStatsStore.getState().recent;
  expect(loaded).toEqual(legacy);
  expect(matchPreset(loaded!.game.rules)).toBe(PresetId.Classic);
});

test('a Blitz game saved before the one joker rule loads unchanged and keeps its total', async () => {
  // Blitz paid no bonus per further Yatzy then, so none of its sheets ever had one.
  const legacyRules = { ...PRESETS[PresetId.Blitz], yatzyBonus: 0, joker: 'official' };
  const legacy = saved('session-blitz', {
    game: {
      ...PLAYED,
      rules: legacyRules,
      players: PLAYED.players.map((player) => ({
        ...player,
        sheets: player.sheets.map((sheet) => ({ ...sheet, extraYatzys: 0 })),
      })),
    },
  });
  const total = totalOf(legacy.game, LUKAS.id);
  await AsyncStorage.setItem(
    'nearbydice.stats.v1',
    JSON.stringify({
      state: { modes: {}, recent: [legacy], trainingBest: 0, trainingBestId: null },
      version: 0,
    }),
  );

  await rehydrate();

  const [loaded] = useStatsStore.getState().recent;
  expect(loaded).toEqual(legacy);
  expect(matchPreset(loaded!.game.rules)).toBe(PresetId.Blitz);
  expect(totalOf(loaded!.game, LUKAS.id)).toBe(total);
});
