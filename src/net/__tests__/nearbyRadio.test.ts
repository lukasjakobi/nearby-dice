import { Platform } from 'react-native';

import NearbyConnections from '@modules/nearby-connections';

import { FakeNetwork } from '../fake/FakeNetwork';
import { FakeTransport } from '../fake/FakeTransport';
import { NearbyTransport } from '../nearby/NearbyTransport';
import { RadioState } from '../transport';

jest.mock('@modules/nearby-connections', () => ({
  __esModule: true,
  default: {
    addListener: jest.fn(),
    isBluetoothEnabled: jest.fn(),
    isLocationEnabled: jest.fn(),
  },
}));

const native = jest.mocked(NearbyConnections!);

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

test.each([
  [false, false, RadioState.BluetoothOff],
  [false, true, RadioState.BluetoothOff],
  [true, false, RadioState.LocationOff],
  [true, true, RadioState.Ready],
])('Android Bluetooth %s and location %s reports %s', async (bluetooth, location, expected) => {
  jest.replaceProperty(Platform, 'OS', 'android');
  native.isBluetoothEnabled.mockResolvedValue(bluetooth);
  native.isLocationEnabled.mockResolvedValue(location);

  await expect(new NearbyTransport().getRadioState()).resolves.toBe(expected);
  expect(native.isLocationEnabled).toHaveBeenCalledTimes(bluetooth ? 1 : 0);
});

test('iOS needs Bluetooth without an Android Location Services check', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  native.isBluetoothEnabled.mockResolvedValue(true);

  await expect(new NearbyTransport().getRadioState()).resolves.toBe(RadioState.Ready);
  expect(native.isLocationEnabled).not.toHaveBeenCalled();
});

test.each(Object.values(RadioState))('fake transport can report %s', async (radio) => {
  const transport = new FakeTransport(new FakeNetwork());
  transport.radio = radio;
  await expect(transport.getRadioState()).resolves.toBe(radio);
});
