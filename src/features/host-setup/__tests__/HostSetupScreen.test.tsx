import { act, fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { t } from '@/test/i18n';
import { getTransport } from '@/net/createTransport';
import { FakeNetwork } from '@/net/fake/FakeNetwork';
import { FakeTransport } from '@/net/fake/FakeTransport';
import { getRoundScanner, setActiveSession } from '@/session/activeSession';
import { HostSession } from '@/session/HostSession';
import { RoundScanner } from '@/session/RoundScanner';
import { TIMING } from '@/session/timing';
import { useProfileStore } from '@/store/profile';
import { LUKAS } from '@/test/fixtures';
import { renderScreen } from '@/test/render';

import { HostSetupScreen } from '../HostSetupScreen';

jest.mock('@/net/createTransport', () => ({ getTransport: jest.fn() }));
jest.mock('@/session/activeSession', () => ({
  getRoundScanner: jest.fn(),
  setActiveSession: jest.fn(),
}));

/** Permission and radio are checked; the collision scan is still running. */
const DURING_SCAN_MS = TIMING.codeCollisionScan / 2;

let network: FakeNetwork;
let transport: FakeTransport;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  network = new FakeNetwork(10);
  transport = new FakeTransport(network, 'host');
  jest.mocked(getTransport).mockReturnValue(transport);
  jest.mocked(getRoundScanner).mockReturnValue(new RoundScanner(transport));
  useProfileStore.setState({ profile: LUKAS });
});

afterEach(() => {
  jest.useRealTimers();
});

test('an opened lobby becomes the active session', async () => {
  const view = await renderScreen(<HostSetupScreen />);

  await fireEvent.press(screen.getByText(t('hostSetup.open')));
  await act(async () => jest.advanceTimersByTimeAsync(TIMING.codeCollisionScan));

  expect(setActiveSession).toHaveBeenCalledWith(expect.any(HostSession));
  expect(router.replace).toHaveBeenCalledWith('/host-lobby');
  expect(network.advertisementOf(transport)).not.toBeNull();
  jest.mocked(setActiveSession).mock.calls[0]![0]!.dispose();
  await view.unmount();
});

test('going back during the collision scan stops opening the lobby', async () => {
  const view = await renderScreen(<HostSetupScreen />);

  await fireEvent.press(screen.getByText(t('hostSetup.open')));
  await act(async () => jest.advanceTimersByTimeAsync(DURING_SCAN_MS));
  await fireEvent.press(screen.getByLabelText(t('common.back')));
  await act(async () => jest.advanceTimersByTimeAsync(TIMING.codeCollisionScan));

  expect(router.back).toHaveBeenCalledTimes(1);
  expect(setActiveSession).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
  expect(network.advertisementOf(transport)).toBeNull();
  await view.unmount();
});

test('leaving the screen during the collision scan stops opening the lobby', async () => {
  const view = await renderScreen(<HostSetupScreen />);

  await fireEvent.press(screen.getByText(t('hostSetup.open')));
  await act(async () => jest.advanceTimersByTimeAsync(DURING_SCAN_MS));
  await view.unmount();
  await act(async () => jest.advanceTimersByTimeAsync(TIMING.codeCollisionScan));

  expect(setActiveSession).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
  expect(network.advertisementOf(transport)).toBeNull();
});
