import { resolve } from 'path';

import app from '../../../app.json';

const pluginPath = resolve(__dirname, '../../../plugins/withDevVariant.js');

type DevVariant = { configureDevVariant: (source: string) => string };

const template = `android {
    defaultConfig {
        applicationId 'io.jakobi.nearbydice'
    }
    signingConfigs {
        debug { storeFile file('debug.keystore') }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
        }
    }
}`;

const releaseBlock = (source: string) => source.match(/release \{[^}]*\}/)?.[0];

test('dev variant plugin is registered in app.json', () => {
  expect(app.expo.plugins).toContain('./plugins/withDevVariant');
});

test('dev variant suffix applies to debug only and is idempotent', () => {
  const { configureDevVariant } = jest.requireActual<DevVariant>(pluginPath);
  const configured = configureDevVariant(template);
  expect(configured).toMatch(/buildTypes\s*\{\s*debug\s*\{\s*applicationIdSuffix '\.dev'/);
  expect(configured.match(/applicationIdSuffix/g)).toHaveLength(1);
  expect(releaseBlock(configured)).toBe(releaseBlock(template));
  expect(configured).toContain('signingConfig signingConfigs.debug\n');
  expect(configureDevVariant(configured)).toBe(configured);
});

test('malformed or unexpected build files fail rather than silently skipping the suffix', () => {
  const { configureDevVariant } = jest.requireActual<DevVariant>(pluginPath);
  expect(() => configureDevVariant('android { defaultConfig { } }')).toThrow('buildTypes');
  expect(() => configureDevVariant('android { buildTypes { release { } } }')).toThrow('debug');
  expect(() => configureDevVariant('android { buildTypes { debug { ')).toThrow();
  expect(() =>
    configureDevVariant(
      "android { buildTypes { debug { applicationIdSuffix '.other' } release { } } }",
    ),
  ).toThrow('applicationIdSuffix');
});
