import { isBoolean } from '@/domain';

import { createPersistedStore } from './createPersistedStore';

export enum ThemeMode {
  Light = 'light',
  Dark = 'dark',
  System = 'system',
}

export enum LanguageMode {
  German = 'de',
  English = 'en',
  System = 'system',
}

/** Switches that also carry a volume level. */
export type VolumeKey = 'sound' | 'music';

/** Volume levels move in tenths so a drag writes at most ten settings updates. */
export const VOLUME_STEP = 0.1;

export function clampVolume(value: number): number {
  const steps = Math.round(Math.min(1, Math.max(0, value)) / VOLUME_STEP);

  return Math.round(steps * VOLUME_STEP * 10) / 10;
}

type SettingsData = {
  themeMode: ThemeMode;
  languageMode: LanguageMode;
  sound: boolean;
  music: boolean;
  haptics: boolean;
  /** 0–1, scales sound effects. */
  soundVolume: number;
  /** 0–1, scales background music. */
  musicVolume: number;
  /** Keeps the screen on in the lobby and during the game. */
  keepAwake: boolean;
};

/** Settings that are switched on or off. */
const SWITCHES = [
  'sound',
  'music',
  'haptics',
  'keepAwake',
] as const satisfies readonly (keyof SettingsData)[];
type Switch = (typeof SWITCHES)[number];

const DEFAULTS: SettingsData = {
  themeMode: ThemeMode.System,
  languageMode: LanguageMode.System,
  sound: true,
  music: false,
  haptics: true,
  soundVolume: 0.7,
  musicVolume: 0.7,
  keepAwake: true,
};

const isThemeMode = (value: unknown): value is ThemeMode =>
  (Object.values(ThemeMode) as unknown[]).includes(value);

const isLanguageMode = (value: unknown): value is LanguageMode =>
  (Object.values(LanguageMode) as unknown[]).includes(value);

function sanitizeSettings(stored: Record<string, unknown>): Partial<SettingsData> {
  const state: Partial<SettingsData> = {};
  if (isThemeMode(stored.themeMode)) state.themeMode = stored.themeMode;
  if (isLanguageMode(stored.languageMode)) state.languageMode = stored.languageMode;
  for (const key of SWITCHES) {
    const value = stored[key];
    if (isBoolean(value)) state[key] = value;
  }

  for (const key of ['soundVolume', 'musicVolume'] as const) {
    const value = stored[key];
    if (typeof value === 'number' && Number.isFinite(value)) state[key] = clampVolume(value);
  }

  return state;
}

export const useSettingsStore = createPersistedStore({
  key: 'nearbydice.settings.v1',
  defaults: DEFAULTS,
  sanitize: sanitizeSettings,
  actions: (update) => ({
    setThemeMode: (themeMode: ThemeMode) => update(() => ({ themeMode })),
    setLanguageMode: (languageMode: LanguageMode) => update(() => ({ languageMode })),
    toggle: (key: Switch) => update((settings) => ({ [key]: !settings[key] })),
    setVolume: (key: VolumeKey, value: number) =>
      update(() =>
        key === 'sound' ? { soundVolume: clampVolume(value) } : { musicVolume: clampVolume(value) },
      ),
  }),
});
