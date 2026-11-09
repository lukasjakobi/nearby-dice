import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';

import { PermissionStatus } from '@/net';
import { LanguageMode, useErrorLogStore, useSettingsStore } from '@/store';
import { renderScreen } from '@/test/render';

import { SettingsScreen } from '../SettingsScreen';

const mockTransport = {
  getPermission: jest.fn(() => new Promise<PermissionStatus>(() => {})),
  getRadioState: () => Promise.reject(new Error('radio unavailable')),
};
jest.mock('@/net/createTransport', () => ({ getTransport: () => mockTransport }));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(() => Promise.resolve(true)) }));

afterEach(() => act(() => useSettingsStore.getState().setLanguageMode(LanguageMode.System)));

test('the language picker offers System, Deutsch and English and stores the choice', async () => {
  await renderScreen(<SettingsScreen />);
  const picker = within(screen.getByLabelText('Sprache'));

  expect(picker.getByRole('radio', { name: 'System', checked: true })).toBeTruthy();
  expect(picker.getByRole('radio', { name: 'Deutsch' })).toBeTruthy();

  await fireEvent.press(picker.getByRole('radio', { name: 'English' }));

  expect(useSettingsStore.getState().languageMode).toBe(LanguageMode.English);
});

test('copy diagnostics copies the recent errors and confirms it', async () => {
  mockTransport.getPermission.mockResolvedValue(PermissionStatus.Granted);
  useErrorLogStore.getState().record(new Error('board broke'), { fatal: true });
  await renderScreen(<SettingsScreen />);

  await fireEvent.press(screen.getByRole('button', { name: 'Diagnose kopieren' }));

  await waitFor(() => expect(screen.getByText('Diagnose kopiert.')).toBeTruthy());
  const copied = jest.mocked(Clipboard.setStringAsync).mock.calls[0]?.[0];
  expect(copied).toContain('Error: board broke');
  expect(copied).toContain('permission granted, radio unknown');
});
