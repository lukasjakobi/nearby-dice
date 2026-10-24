import { resolve } from 'path';

import app from '../../../app.json';

const pluginPath = resolve(__dirname, '../../../plugins/withReleaseSigning.js');

test('release signing protection survives native regeneration', () => {
  expect(app.expo.plugins).toContain('./plugins/withReleaseSigning');
});

test('release signing removes the development key and is idempotent', () => {
  // The same transformer is applied by the Expo mod and to the existing checkout.
  const { configureReleaseSigning } = jest.requireActual<{
    configureReleaseSigning: (source: string) => string;
  }>(pluginPath);
  const template = `android {
    signingConfigs { debug { storeFile file('debug.keystore') } }
    buildTypes {
      debug { signingConfig signingConfigs.debug }
      release {
        signingConfig signingConfigs.debug
        minifyEnabled false
      }
    }
  }`;
  const configured = configureReleaseSigning(template);
  expect(configured).toContain('debug { signingConfig signingConfigs.debug }');
  expect(configured).not.toMatch(/release\s*\{\s*signingConfig signingConfigs\.debug/);
  expect(configured).toContain('signingConfig signingConfigs.release');
  expect(configured).toContain('NEARBY_DICE_RELEASE_STORE_FILE');
  expect(configured).toContain('validateSigning');
  expect(configured).toContain('androiddebugkey');
  expect(configured).toContain('throw new GradleException');
  expect(configureReleaseSigning(configured)).toBe(configured);
});

test('malformed generated signing blocks fail rather than silently losing protection', () => {
  const { configureReleaseSigning } = jest.requireActual<{
    configureReleaseSigning: (source: string) => string;
  }>(pluginPath);
  expect(() =>
    configureReleaseSigning('// @generated begin nearby-dice-release-signing'),
  ).toThrow();
});
