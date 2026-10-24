import { LanguageMode } from '@/store';

export enum Locale {
  German = 'de',
  English = 'en',
}

export function localeFor(mode: LanguageMode, deviceLanguages: readonly (string | null)[]): Locale {
  if (mode === LanguageMode.German) return Locale.German;
  if (mode === LanguageMode.English) return Locale.English;
  const locales = Object.values(Locale) as string[];

  return (deviceLanguages.find((code) => code !== null && locales.includes(code)) ??
    Locale.English) as Locale;
}
