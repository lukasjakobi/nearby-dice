import { act, fireEvent, screen, within } from '@testing-library/react-native';

import { LanguageMode, useSettingsStore } from '@/store';
import { renderScreen } from '@/test/render';

import { SettingsScreen } from '../SettingsScreen';

jest.mock('@/net/createTransport', () => ({
  getTransport: () => ({ getPermission: () => new Promise(() => {}) }),
}));

afterEach(() => act(() => useSettingsStore.getState().setLanguageMode(LanguageMode.System)));

test('the language picker offers System, Deutsch and English and stores the choice', async () => {
  await renderScreen(<SettingsScreen />);
  const picker = within(screen.getByLabelText('Sprache'));

  expect(picker.getByRole('radio', { name: 'System', checked: true })).toBeTruthy();
  expect(picker.getByRole('radio', { name: 'Deutsch' })).toBeTruthy();

  await fireEvent.press(picker.getByRole('radio', { name: 'English' }));

  expect(useSettingsStore.getState().languageMode).toBe(LanguageMode.English);
});
