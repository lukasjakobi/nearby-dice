import { act, fireEvent, screen } from '@testing-library/react-native';
import { useEffect } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';

import { t } from '@/test/i18n';
import { FakeNetwork } from '@/net/fake/FakeNetwork';
import { FakeTransport } from '@/net/fake/FakeTransport';
import { PermissionStatus, RadioState } from '@/net/transport';
import { renderScreen } from '@/test/render';

import { PermissionSheet } from '../PermissionSheet';
import { usePermissionGate } from '../usePermissionGate';

jest.mock('@/net/createTransport', () => ({ getTransport: jest.fn() }));

let transport: FakeTransport;
let gate: ReturnType<typeof usePermissionGate>;
let foreground: (state: AppStateStatus) => void;

function Harness() {
  const permissions = usePermissionGate(transport);
  useEffect(() => {
    gate = permissions;
  }, [permissions]);

  return permissions.sheet ? <PermissionSheet {...permissions.sheet} /> : null;
}

async function begin() {
  let result!: Promise<boolean>;
  await act(async () => {
    result = gate.ensureReady();
  });

  return { result };
}

beforeEach(() => {
  jest.clearAllMocks();
  transport = new FakeTransport(new FakeNetwork());
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
    foreground = listener;

    return { remove: jest.fn() };
  });
  jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
  jest.spyOn(Linking, 'sendIntent').mockResolvedValue(undefined);
});

afterEach(() => jest.restoreAllMocks());

test('granted permissions and ready radios continue without a sheet or system request', async () => {
  const request = jest.spyOn(transport, 'requestPermission');
  await renderScreen(<Harness />);
  const { result } = await begin();
  await expect(result).resolves.toBe(true);
  expect(request).not.toHaveBeenCalled();
  expect(screen.queryByText(t('permission.primer.title'))).toBeNull();
});

test('denied permission shows the primer before requesting, then continues when granted', async () => {
  transport.permission = PermissionStatus.Denied;
  const request = jest.spyOn(transport, 'requestPermission').mockImplementation(async () => {
    transport.permission = PermissionStatus.Granted;

    return transport.permission;
  });
  await renderScreen(<Harness />);
  const { result } = await begin();
  expect(screen.getByText(t('permission.primer.title'))).toBeTruthy();
  expect(request).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText(t('permission.allow')));
  await expect(result).resolves.toBe(true);
  expect(request).toHaveBeenCalledTimes(1);
});

test('location permission copy only appears on Android', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  transport.permission = PermissionStatus.Denied;
  await renderScreen(<Harness />);
  const { result } = await begin();
  expect(screen.getByText(t('permission.androidLocation'))).toBeTruthy();
  await fireEvent.press(screen.getByText(t('permission.later')));
  await expect(result).resolves.toBe(false);
});

test('iOS does not display Android location permission copy', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  transport.permission = PermissionStatus.Denied;
  await renderScreen(<Harness />);
  const { result } = await begin();
  expect(screen.queryByText(t('permission.androidLocation'))).toBeNull();
  await fireEvent.press(screen.getByText(t('permission.later')));
  await expect(result).resolves.toBe(false);
});

test.each([PermissionStatus.Denied, PermissionStatus.Blocked])(
  'a system request ending in %s shows settings rather than another prompt',
  async (status) => {
    transport.permission = PermissionStatus.Denied;
    jest.spyOn(transport, 'requestPermission').mockResolvedValue(status);
    await renderScreen(<Harness />);
    const { result } = await begin();
    await fireEvent.press(screen.getByText(t('permission.allow')));
    expect(screen.getByText(t('permission.blocked.title'))).toBeTruthy();
    expect(screen.getByText(t('permission.openSettings'))).toBeTruthy();
    await fireEvent.press(screen.getByText(t('permission.later')));
    await expect(result).resolves.toBe(false);
  },
);

test('blocked permissions open app settings and resume automatically on foreground', async () => {
  transport.permission = PermissionStatus.Blocked;
  const request = jest.spyOn(transport, 'requestPermission');
  await renderScreen(<Harness />);
  const { result } = await begin();
  await fireEvent.press(screen.getByText(t('permission.openSettings')));
  expect(Linking.openSettings).toHaveBeenCalledTimes(1);
  transport.permission = PermissionStatus.Granted;
  await act(async () => foreground('active'));
  await expect(result).resolves.toBe(true);
  expect(request).not.toHaveBeenCalled();
});

test.each([
  [
    RadioState.BluetoothOff,
    t('permission.bluetoothOff.title'),
    'android.settings.BLUETOOTH_SETTINGS',
  ],
  [
    RadioState.LocationOff,
    t('permission.locationOff.title'),
    'android.settings.LOCATION_SOURCE_SETTINGS',
  ],
])(
  'Android %s opens its radio settings and resumes after activation',
  async (radio, title, intent) => {
    jest.replaceProperty(Platform, 'OS', 'android');
    transport.radio = radio as RadioState;
    await renderScreen(<Harness />);
    const { result } = await begin();
    expect(screen.getByText(title)).toBeTruthy();
    await fireEvent.press(screen.getByText(t('permission.openSettings')));
    expect(Linking.sendIntent).toHaveBeenCalledWith(intent);
    transport.radio = RadioState.Ready;
    await act(async () => foreground('active'));
    await expect(result).resolves.toBe(true);
  },
);

test('iOS radio guidance opens app settings', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  transport.radio = RadioState.BluetoothOff;
  await renderScreen(<Harness />);
  const { result } = await begin();
  await fireEvent.press(screen.getByText(t('permission.openSettings')));
  expect(Linking.openSettings).toHaveBeenCalledTimes(1);
  expect(Linking.sendIntent).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText(t('permission.later')));
  await expect(result).resolves.toBe(false);
});

test('unavailable transport explains the limitation and does not request permission', async () => {
  transport.permission = PermissionStatus.Unavailable;
  const request = jest.spyOn(transport, 'requestPermission');
  await renderScreen(<Harness />);
  const { result } = await begin();
  expect(screen.getByText(t('permission.unavailable.title'))).toBeTruthy();
  expect(screen.queryByText(t('permission.openSettings'))).toBeNull();
  await fireEvent.press(screen.getByText(t('permission.retry')));
  expect(request).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText(t('permission.later')));
  await expect(result).resolves.toBe(false);
});

test('simultaneous callers share one gate and cancellation resolves them all', async () => {
  transport.permission = PermissionStatus.Denied;
  const read = jest.spyOn(transport, 'getPermission');
  await renderScreen(<Harness />);
  let first!: Promise<boolean>;
  let second!: Promise<boolean>;
  await act(async () => {
    first = gate.ensureReady();
    second = gate.ensureReady();
  });
  expect(first).toBe(second);
  expect(read).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByText(t('permission.later')));
  await expect(first).resolves.toBe(false);
  await expect(second).resolves.toBe(false);
});

test('unmount cancels the gate and ignores a late system permission result', async () => {
  transport.permission = PermissionStatus.Denied;
  let grant!: (status: PermissionStatus) => void;
  jest.spyOn(transport, 'requestPermission').mockImplementation(
    () =>
      new Promise((resolve) => {
        grant = resolve;
      }),
  );
  const view = await renderScreen(<Harness />);
  const { result } = await begin();
  await fireEvent.press(screen.getByText(t('permission.allow')));
  await view.unmount();
  await expect(result).resolves.toBe(false);
  await act(async () => grant(PermissionStatus.Granted));
});

test('foreground during a system prompt cannot start a duplicate request', async () => {
  transport.permission = PermissionStatus.Denied;
  let deny!: (status: PermissionStatus) => void;
  const request = jest.spyOn(transport, 'requestPermission').mockImplementation(
    () =>
      new Promise((resolve) => {
        deny = resolve;
      }),
  );
  await renderScreen(<Harness />);
  const { result } = await begin();
  await fireEvent.press(screen.getByText(t('permission.allow')));
  await act(async () => foreground('active'));
  await act(async () => deny(PermissionStatus.Denied));
  expect(screen.getByText(t('permission.blocked.title'))).toBeTruthy();
  expect(request).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByText(t('permission.later')));
  await expect(result).resolves.toBe(false);
});

test('permission check failure offers a retry and can recover', async () => {
  jest.spyOn(transport, 'getPermission').mockRejectedValueOnce(new Error('native failure'));
  await renderScreen(<Harness />);
  const { result } = await begin();
  expect(screen.getByText(t('permission.checkFailed.title'))).toBeTruthy();
  await fireEvent.press(screen.getByText(t('permission.retry')));
  await expect(result).resolves.toBe(true);
});

test('settings errors stay actionable and cancel cleanly', async () => {
  transport.permission = PermissionStatus.Blocked;
  jest.mocked(Linking.openSettings).mockRejectedValueOnce(new Error('settings failed'));
  await renderScreen(<Harness />);
  const { result } = await begin();
  await fireEvent.press(screen.getByText(t('permission.openSettings')));
  expect(screen.getByText(t('permission.settingsFailed'))).toBeTruthy();
  await fireEvent.press(screen.getByText(t('permission.later')));
  await expect(result).resolves.toBe(false);
});
