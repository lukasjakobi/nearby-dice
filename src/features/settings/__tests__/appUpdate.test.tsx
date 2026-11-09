import { act, fireEvent, screen } from '@testing-library/react-native';

import { renderScreen } from '@/test/render';

import { downloadApk, fetchLatestRelease, openInstaller } from '../services/appUpdater';
import { SettingsScreen } from '../SettingsScreen';

let mockSupported = true;

jest.mock('expo-constants', () => ({ expoConfig: { version: '1.2.0' } }));
jest.mock('@/net/createTransport', () => ({
  getTransport: () => ({ getPermission: () => new Promise(() => {}) }),
}));
jest.mock('../services/appUpdater', () => ({
  get updatesSupported() {
    return mockSupported;
  },
  fetchLatestRelease: jest.fn(),
  downloadApk: jest.fn(),
  openInstaller: jest.fn(),
}));

const RELEASE = { version: '1.3.0', apkUrl: 'https://example.test/nearby-dice-v1.3.0.apk' };
const APK = { contentUri: 'content://apk' };

beforeEach(() => {
  mockSupported = true;
  jest.mocked(fetchLatestRelease).mockResolvedValue(RELEASE);
  jest.mocked(downloadApk).mockResolvedValue(APK as never);
  jest.mocked(openInstaller).mockResolvedValue();
});

const press = (name: string) => fireEvent.press(screen.getByRole('button', { name }));

test('the check reports when the installed version is the newest one', async () => {
  jest.mocked(fetchLatestRelease).mockResolvedValue({ ...RELEASE, version: '1.2.0' });
  await renderScreen(<SettingsScreen />);

  expect(screen.getByText('Version 1.2.0')).toBeTruthy();
  await press('Nach Updates suchen');

  expect(screen.getByText('Du hast die neueste Version.')).toBeTruthy();
});

test('a newer release downloads with progress and opens the installer', async () => {
  const download = { progress: (_fraction: number) => {}, finish: () => {} };
  jest.mocked(downloadApk).mockImplementation(
    (_release, onProgress) =>
      new Promise((resolve) => {
        download.progress = onProgress;
        download.finish = () => resolve(APK as never);
      }),
  );
  await renderScreen(<SettingsScreen />);

  await press('Nach Updates suchen');
  expect(screen.getByText('Version 1.3.0 verfügbar')).toBeTruthy();

  await press('Herunterladen und installieren');
  await act(async () => download.progress(0.42));
  expect(screen.getByText('Wird geladen … 42 %')).toBeTruthy();

  await act(async () => download.finish());
  expect(downloadApk).toHaveBeenCalledWith(RELEASE, expect.any(Function));
  expect(openInstaller).toHaveBeenCalledWith(APK);
  // Cancelling the installer leaves the update ready to try again.
  expect(screen.getByRole('button', { name: 'Herunterladen und installieren' })).toBeTruthy();
});

test('failures say what went wrong and offer a retry', async () => {
  jest.mocked(fetchLatestRelease).mockRejectedValueOnce(new Error('offline'));
  jest.mocked(downloadApk).mockRejectedValueOnce(new Error('offline'));
  await renderScreen(<SettingsScreen />);

  await press('Nach Updates suchen');
  expect(screen.getByRole('alert')).toHaveTextContent('Prüfen fehlgeschlagen. Bist du online?');

  await press('Erneut versuchen');
  await press('Herunterladen und installieren');
  expect(screen.getByRole('alert')).toHaveTextContent('Download fehlgeschlagen.');

  await press('Erneut versuchen');
  expect(openInstaller).toHaveBeenCalledWith(APK);
});

test('without update support only the version is shown', async () => {
  mockSupported = false;
  await renderScreen(<SettingsScreen />);

  expect(screen.getByText('1.2.0')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Nach Updates suchen' })).toBeNull();
});
