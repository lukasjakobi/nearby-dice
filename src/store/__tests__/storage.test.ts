import AsyncStorage from '@react-native-async-storage/async-storage';

import { ANTONIA, JONAS, LUKAS, savedGame } from '@/test/fixtures';

import { LanguageMode, ThemeMode, useSettingsStore } from '../settings';
import { useStatsStore } from '../stats';
import { createValidatedStorage } from '../storage';

function rehydrate(store: typeof useSettingsStore | typeof useStatsStore): Promise<void> {
  return new Promise((resolve) => {
    const unsubscribe = store.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
    void store.persist.rehydrate();
  });
}

async function waitForInitialHydration(store: typeof useSettingsStore | typeof useStatsStore) {
  if (store.persist.hasHydrated()) return;
  await new Promise<void>((resolve) => store.persist.onFinishHydration(() => resolve()));
}

async function backups(key: string): Promise<number> {
  const keys = await AsyncStorage.getAllKeys();

  return keys.filter((stored) => stored.startsWith(`${key}.corrupt.`)).length;
}

const STATS_KEY = 'nearbydice.stats.v1';
const game = (id: string) => savedGame([LUKAS, ANTONIA, JONAS], ANTONIA, { id });

test('malformed JSON is quarantined and hydration settles with defaults', async () => {
  await waitForInitialHydration(useSettingsStore);
  await AsyncStorage.setItem('nearbydice.settings.v1', '{broken');

  await rehydrate(useSettingsStore);

  expect(useSettingsStore.persist.hasHydrated()).toBe(true);
  expect(useSettingsStore.getState().themeMode).toBe(ThemeMode.System);
  expect(await AsyncStorage.getItem('nearbydice.settings.v1')).toBeNull();
  const keys = await AsyncStorage.getAllKeys();
  expect(keys.some((key) => key.startsWith('nearbydice.settings.v1.corrupt.'))).toBe(true);
});

test('valid persisted settings survive validation', async () => {
  await waitForInitialHydration(useSettingsStore);
  await AsyncStorage.setItem(
    'nearbydice.settings.v1',
    JSON.stringify({
      state: { themeMode: ThemeMode.Dark, languageMode: LanguageMode.English, sound: false },
      version: 0,
    }),
  );
  expect(await AsyncStorage.getItem('nearbydice.settings.v1')).toContain('dark');

  await rehydrate(useSettingsStore);

  expect(useSettingsStore.getState().themeMode).toBe(ThemeMode.Dark);
  expect(useSettingsStore.getState().languageMode).toBe(LanguageMode.English);
  expect(useSettingsStore.getState().sound).toBe(false);
  expect(useSettingsStore.getState().haptics).toBe(true);
  expect(useSettingsStore.getState().music).toBe(false);
});

test('music preference survives hydration independently of muted effects', async () => {
  await waitForInitialHydration(useSettingsStore);
  await AsyncStorage.setItem(
    'nearbydice.settings.v1',
    JSON.stringify({ state: { sound: false, music: true }, version: 0 }),
  );

  await rehydrate(useSettingsStore);

  expect(useSettingsStore.getState().sound).toBe(false);
  expect(useSettingsStore.getState().music).toBe(true);
});

test('persisted volume levels are clamped to tenths and garbage falls back to defaults', async () => {
  await waitForInitialHydration(useSettingsStore);
  useSettingsStore.setState({ soundVolume: 0.7, musicVolume: 0.7 });
  await AsyncStorage.setItem(
    'nearbydice.settings.v1',
    JSON.stringify({ state: { soundVolume: 1.4, musicVolume: 'loud' }, version: 0 }),
  );

  await rehydrate(useSettingsStore);

  expect(useSettingsStore.getState().soundVolume).toBe(1);
  expect(useSettingsStore.getState().musicVolume).toBe(0.7);
});

test('rejected storage reads settle real Zustand hydration with default state', async () => {
  await waitForInitialHydration(useStatsStore);
  // AsyncStorage's jest mock is already a jest.fn, so spyOn would return it and mockRestore
  // would wipe its implementation for later tests; a one-off rejection is enough here.
  jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('disk unavailable'));

  await rehydrate(useStatsStore);

  expect(useStatsStore.persist.hasHydrated()).toBe(true);
  expect(useStatsStore.getState().recent).toEqual([]);
});

test('a pre-per-mode stats blob is quarantined; its training best survives, its mode-less totals do not', async () => {
  await waitForInitialHydration(useStatsStore);
  const setItem = jest.mocked(AsyncStorage.setItem);
  setItem.mockClear();
  await AsyncStorage.setItem(
    'nearbydice.stats.v1',
    JSON.stringify({
      state: {
        wins: 1,
        best: 120,
        yatzys: 0,
        recent: [],
        trainingBest: 140,
        trainingBestId: 'x',
      },
      version: 0,
    }),
  );

  await rehydrate(useStatsStore);

  expect(useStatsStore.getState().trainingBest).toBe(140);
  expect(useStatsStore.getState().trainingBestId).toBe('x');
  // The lifetime total has no mode attached, so it cannot count towards any mode.
  expect(useStatsStore.getState().modes).toEqual({});
  expect(setItem.mock.calls.some(([key]) => key.includes('.corrupt.'))).toBe(true);
});

test('after a failed read, writes leave the data on disk alone until a read succeeds', async () => {
  await waitForInitialHydration(useStatsStore);
  const onDisk = JSON.stringify({
    state: { modes: {}, recent: [game('kept')], trainingBest: 50, trainingBestId: 't' },
    version: 0,
  });
  await AsyncStorage.setItem(STATS_KEY, onDisk);
  jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('disk unavailable'));
  await rehydrate(useStatsStore);

  useStatsStore.getState().record(game('new'));
  useStatsStore.getState().reset();

  expect(await AsyncStorage.getItem(STATS_KEY)).toBe(onDisk);
  await rehydrate(useStatsStore);
  expect(useStatsStore.getState().recent.map(({ id }) => id)).toEqual(['kept']);
  expect(useStatsStore.getState().trainingBest).toBe(50);
});

test('a dropped saved game is backed up once and the cleaned state is written back', async () => {
  await waitForInitialHydration(useStatsStore);
  const before = await backups(STATS_KEY);
  await AsyncStorage.setItem(
    STATS_KEY,
    JSON.stringify({
      state: { modes: {}, recent: [game('valid'), { id: 'summary-row' }] },
      version: 0,
    }),
  );

  await rehydrate(useStatsStore);
  await rehydrate(useStatsStore);

  expect(await backups(STATS_KEY)).toBe(before + 1);
  const stored = JSON.parse((await AsyncStorage.getItem(STATS_KEY))!);
  expect(stored.state.recent.map(({ id }: { id: string }) => id)).toEqual(['valid']);
});

test('unreadable data stays on disk when it cannot be backed up', async () => {
  await waitForInitialHydration(useSettingsStore);
  await AsyncStorage.setItem('nearbydice.settings.v1', '{broken');
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('disk full'));

  await rehydrate(useSettingsStore);
  useSettingsStore.getState().toggle('sound');

  expect(await AsyncStorage.getItem('nearbydice.settings.v1')).toBe('{broken');
});

test('a state stored by an older version is migrated before it is sanitized', async () => {
  const storage = createValidatedStorage<{ total: number }>({
    version: 2,
    sanitize: (stored) => (typeof stored.total === 'number' ? { total: stored.total } : {}),
    migrate: (stored, version) => ({ total: Number(stored.points) * version }),
  });
  await AsyncStorage.setItem('test.migrate', JSON.stringify({ state: { points: 21 }, version: 1 }));

  expect(await storage.getItem('test.migrate')).toEqual({ state: { total: 21 }, version: 2 });
  expect(JSON.parse((await AsyncStorage.getItem('test.migrate'))!)).toEqual({
    state: { total: 21 },
    version: 2,
  });
  expect(await backups('test.migrate')).toBe(1);
});
