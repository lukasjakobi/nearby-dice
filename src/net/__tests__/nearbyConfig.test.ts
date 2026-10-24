import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PermissionStatus as ExpoPermissionStatus } from 'expo';

import appConfig from '../../../app.json';
import { SERVICE_ID, toPermissionStatus } from '../nearby/NearbyTransport';
import { PermissionStatus } from '../transport';

test('iOS NSBonjourServices matches the Nearby service ID (first 12 hex chars of SHA-256)', () => {
  const hash = createHash('sha256').update(SERVICE_ID).digest('hex').slice(0, 12).toUpperCase();
  expect(appConfig.expo.ios.infoPlist.NSBonjourServices).toContain(`_${hash}._tcp`);
});

test('Android location declarations remain available on modern devices that require them', () => {
  const manifest = readFileSync(
    join(__dirname, '../../../modules/nearby-connections/android/src/main/AndroidManifest.xml'),
    'utf8',
  );
  for (const permission of ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION']) {
    const declaration = manifest.match(
      new RegExp(`<uses-permission[^>]*android\\.permission\\.${permission}[^>]*>`),
    )?.[0];
    expect(declaration).toBeDefined();
    expect(declaration).not.toContain('android:maxSdkVersion');
  }

  expect(manifest).not.toContain('neverForLocation');
});

test('iOS retains the location usage description required for Nearby hotspot upgrades', () => {
  expect(appConfig.expo.ios.infoPlist.NSLocationWhenInUseUsageDescription).toBeTruthy();
});

test.each([
  [ExpoPermissionStatus.GRANTED, true, PermissionStatus.Granted],
  [ExpoPermissionStatus.UNDETERMINED, true, PermissionStatus.Denied],
  [ExpoPermissionStatus.DENIED, true, PermissionStatus.Denied],
  [ExpoPermissionStatus.DENIED, false, PermissionStatus.Blocked],
])('native %s (canAskAgain %s) → %s', (status, canAskAgain, expected) => {
  expect(
    toPermissionStatus({
      status,
      canAskAgain,
      granted: status === ExpoPermissionStatus.GRANTED,
      expires: 'never',
    }),
  ).toBe(expected);
});
