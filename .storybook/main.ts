import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-native-web-vite';
import type { Plugin } from 'vite';

/** The app's web `react-native`: react-native-web plus the newer APIs it lacks (metro.config.js). */
const SHIM = fileURLToPath(new URL('../web/react-native.js', import.meta.url));

/**
 * Sends the app's `react-native` imports to the shim, as Metro does for the web build. The
 * framework's alias has already turned them into `react-native-web`; packages keep the original,
 * and the shim's own import lands on the same react-native-web instance.
 */
function reactNativeShim(): Plugin {
  return {
    name: 'nearby-dice:react-native-shim',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer) return null;
      if (importer === SHIM) {
        return source === 'react-native-web/dist/index'
          ? this.resolve('react-native-web', importer, { ...options, skipSelf: true })
          : null;
      }

      const fromApp = !importer.includes('/node_modules/');

      return fromApp && (source === 'react-native' || source === 'react-native-web') ? SHIM : null;
    },
  };
}

/**
 * The dev server pre-bundles packages with esbuild, which rejects two files Metro takes as they
 * are: Expo's type-only global declarations and react-native-svg's native sound module (loaded
 * lazily on Android touches, never on the web). Both become empty modules there.
 */
const NATIVE_ONLY =
  /expo-modules-core\/build\/ts-declarations\/global\.js$|react-native-svg\/lib\/module\/fabric\/NativeSvgSoundModule\.js$/;

const stubNativeOnly = {
  name: 'nearby-dice:stub-native-only',
  setup(build: {
    onLoad: (options: { filter: RegExp }, load: () => { contents: string }) => void;
  }) {
    build.onLoad({ filter: NATIVE_ONLY }, () => ({ contents: 'export default null;' }));
  },
};

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-a11y'],
  framework: { name: '@storybook/react-native-web-vite', options: {} },
  core: { disableTelemetry: true },
  viteFinal: async (viteConfig) => {
    const { mergeConfig } = await import('vite');

    return mergeConfig(viteConfig, {
      plugins: [reactNativeShim()],
      optimizeDeps: { esbuildOptions: { plugins: [stubNativeOnly] } },
      resolve: {
        alias: {
          // react-native-svg's web build looks images up here; React Native 0.88 no longer ships it.
          '@react-native/assets-registry/registry': 'react-native-web/dist/modules/AssetRegistry',
        },
      },
    });
  },
};

export default config;
