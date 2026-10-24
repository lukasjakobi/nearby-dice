import { act, fireEvent, screen } from '@testing-library/react-native';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';

import { t } from '@/test/i18n';
import { HostSetupScreen } from '@/features/host-setup/HostSetupScreen';
import { JoinScreen } from '@/features/join/JoinScreen';
import { getTransport } from '@/net/createTransport';
import { FakeNetwork } from '@/net/fake/FakeNetwork';
import { FakeTransport } from '@/net/fake/FakeTransport';
import { PermissionStatus, RadioState } from '@/net/transport';
import { getRoundScanner } from '@/session/activeSession';
import { GuestSession } from '@/session/GuestSession';
import { HostOpenError, HostSession } from '@/session/HostSession';
import { RoundScanner } from '@/session/RoundScanner';
import { TIMING } from '@/session/timing';
import { HostError } from '@/session/types';
import { useProfileStore } from '@/store/profile';
import { LUKAS } from '@/test/fixtures';
import { renderScreen } from '@/test/render';

jest.mock('@/net/createTransport', () => ({ getTransport: jest.fn() }));
jest.mock('@/session/activeSession', () => ({
  getRoundScanner: jest.fn(),
  setActiveSession: jest.fn(),
}));

let transport: FakeTransport;
let scanner: RoundScanner;
let foreground: (state: AppStateStatus) => void;

beforeEach(() => {
  jest.clearAllMocks();
  transport = new FakeTransport(new FakeNetwork());
  scanner = new RoundScanner(transport);
  jest.mocked(getTransport).mockReturnValue(transport);
  jest.mocked(getRoundScanner).mockReturnValue(scanner);
  useProfileStore.setState({ profile: LUKAS });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
    foreground = listener;

    return { remove: jest.fn() };
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test('a failed discovery is shown as a search error and can be retried', async () => {
  jest
    .spyOn(transport, 'startDiscovery')
    .mockRejectedValueOnce(new Error('8034: MISSING_PERMISSION_ACCESS_COARSE_LOCATION'));
  const view = await renderScreen(<JoinScreen />);
  expect(screen.getByText(t('join.scanFailed'))).toBeTruthy();
  expect(screen.queryByText(t('join.nearbyEmpty'))).toBeNull();
  await fireEvent.press(screen.getByLabelText(t('join.refresh')));
  expect(screen.queryByText(t('join.scanFailed'))).toBeNull();
  expect(scanner.state.get()).toMatchObject({ scanning: true, error: null });
  await view.unmount();
});

test('refresh restarts discovery, keeps the entered code and prevents duplicate scans', async () => {
  jest.useFakeTimers();
  const start = jest.spyOn(transport, 'startDiscovery');
  const stop = jest.spyOn(transport, 'stopDiscovery');
  const view = await renderScreen(<JoinScreen />);
  await fireEvent.changeText(screen.getByLabelText(t('join.codeLabel')), '7K4M');
  await act(async () => jest.advanceTimersByTimeAsync(TIMING.scanWindow));

  await fireEvent.press(screen.getByLabelText(t('join.refresh')));
  expect(stop).toHaveBeenCalledTimes(1);
  expect(start).toHaveBeenCalledTimes(2);
  expect(screen.getByLabelText(t('join.codeLabel')).props.value).toBe('7K4M');
  expect(screen.getByLabelText(t('join.refresh')).props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(screen.getByLabelText(t('join.refresh')));
  expect(start).toHaveBeenCalledTimes(2);

  await act(async () => jest.advanceTimersByTimeAsync(TIMING.scanWindow));
  expect(screen.getByLabelText(t('join.refresh')).props.accessibilityState.disabled).toBe(false);
  await view.unmount();
});

test('refresh checks radio readiness before restarting discovery', async () => {
  jest.useFakeTimers();
  const start = jest.spyOn(transport, 'startDiscovery');
  const view = await renderScreen(<JoinScreen />);
  await act(async () => jest.advanceTimersByTimeAsync(TIMING.scanWindow));
  transport.radio = RadioState.LocationOff;

  await fireEvent.press(screen.getByLabelText(t('join.refresh')));
  expect(screen.getByText(t('permission.locationOff.title'))).toBeTruthy();
  expect(start).toHaveBeenCalledTimes(1);
  transport.radio = RadioState.Ready;
  await act(async () => foreground('active'));
  expect(start).toHaveBeenCalledTimes(2);
  await view.unmount();
});

test('hosting waits for the primer and system permission before opening a session', async () => {
  transport.permission = PermissionStatus.Denied;
  const open = jest
    .spyOn(HostSession, 'open')
    .mockRejectedValue(new HostOpenError(HostError.PermissionMissing));
  jest.spyOn(transport, 'requestPermission').mockImplementation(async () => {
    transport.permission = PermissionStatus.Granted;

    return transport.permission;
  });
  await renderScreen(<HostSetupScreen />);
  await fireEvent.press(screen.getByText(t('hostSetup.open')));
  expect(screen.getByText(t('permission.primer.title'))).toBeTruthy();
  expect(open).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText(t('permission.allow')));
  expect(open).toHaveBeenCalledTimes(1);
});

test('cancelling host permission leaves the setup usable without opening a session', async () => {
  transport.permission = PermissionStatus.Denied;
  const open = jest.spyOn(HostSession, 'open');
  await renderScreen(<HostSetupScreen />);
  await fireEvent.press(screen.getByText(t('hostSetup.open')));
  await fireEvent.press(screen.getByText(t('permission.later')));
  expect(open).not.toHaveBeenCalled();
  expect(screen.getByText(t('hostSetup.open'))).toBeTruthy();
  await fireEvent.press(screen.getByText(t('hostSetup.open')));
  expect(screen.getByText(t('permission.primer.title'))).toBeTruthy();
  await fireEvent.press(screen.getByText(t('permission.later')));
});

test('host waits for Location Services and automatically resumes after Settings', async () => {
  transport.radio = RadioState.LocationOff;
  const open = jest
    .spyOn(HostSession, 'open')
    .mockRejectedValue(new HostOpenError(HostError.PermissionMissing));
  await renderScreen(<HostSetupScreen />);
  await fireEvent.press(screen.getByText(t('hostSetup.open')));
  expect(screen.getByText(t('permission.locationOff.title'))).toBeTruthy();
  expect(open).not.toHaveBeenCalled();
  transport.radio = RadioState.Ready;
  await act(async () => foreground('active'));
  expect(open).toHaveBeenCalledTimes(1);
});

test('joining acquires discovery only after permission and cancellation can reopen the sheet', async () => {
  transport.permission = PermissionStatus.Denied;
  const acquire = jest.spyOn(scanner, 'acquire');
  jest.spyOn(transport, 'requestPermission').mockImplementation(async () => {
    transport.permission = PermissionStatus.Granted;

    return transport.permission;
  });
  const view = await renderScreen(<JoinScreen />);
  expect(screen.getByText(t('permission.primer.title'))).toBeTruthy();
  expect(acquire).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText(t('permission.later')));
  expect(screen.getByText(t('permission.fallbackTitle'))).toBeTruthy();
  expect(acquire).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText(t('permission.check')));
  expect(screen.getByText(t('permission.primer.title'))).toBeTruthy();
  await fireEvent.press(screen.getByText(t('permission.allow')));
  expect(screen.getByText(t('join.codeTitle'))).toBeTruthy();
  expect(acquire).toHaveBeenCalledTimes(1);
  await view.unmount();
});

test('joining stops discovery and gates the handshake if permission was revoked', async () => {
  const join = jest.spyOn(GuestSession, 'join');
  const stop = jest.spyOn(transport, 'stopDiscovery');
  const view = await renderScreen(<JoinScreen />);
  expect(screen.getByText(t('join.codeTitle'))).toBeTruthy();
  transport.permission = PermissionStatus.Blocked;
  await fireEvent.changeText(screen.getByLabelText(t('join.codeLabel')), '7K4M');
  await fireEvent.press(screen.getByText(t('join.join')));
  expect(screen.getByText(t('permission.blocked.title'))).toBeTruthy();
  expect(join).not.toHaveBeenCalled();
  expect(stop).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByText(t('permission.later')));
  expect(screen.getByText(t('permission.check'))).toBeTruthy();
  await view.unmount();
});
