import { act, renderHook } from '@testing-library/react-native';
import { useLocales } from 'expo-localization';

import { i18n, Locale } from '@/i18n';
import { LanguageMode, useSettingsStore } from '@/store';

import { useAppLanguage } from '../hooks';

jest.mock('expo-localization', () => ({ useLocales: jest.fn() }));

const deviceLanguages = (...codes: string[]) =>
  jest
    .mocked(useLocales)
    .mockReturnValue(
      codes.map((languageCode) => ({ languageCode })) as ReturnType<typeof useLocales>,
    );

afterEach(async () => {
  await act(() => useSettingsStore.getState().setLanguageMode(LanguageMode.System));
  await i18n.changeLanguage(Locale.German);
});

test('follows the device language until one is chosen in Settings', async () => {
  deviceLanguages('fr', 'en');
  await renderHook(() => useAppLanguage());

  expect(i18n.language).toBe(Locale.English);

  await act(() => useSettingsStore.getState().setLanguageMode(LanguageMode.German));

  expect(i18n.language).toBe(Locale.German);
  expect(i18n.t('settings.language')).toBe('Sprache');
});
