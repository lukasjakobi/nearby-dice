import type { Decorator, Preview } from '@storybook/react-native-web-vite';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { i18n, Locale } from '@/i18n';
import { useSettingsStore } from '@/store';
import { ColorScheme, FONT_ASSETS, ThemeProvider, ToastProvider, useTheme } from '@/ui';

/** A phone-sized frame without notch insets. */
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/** A `require`d file under Vite: its URL, or a module whose default export is the URL. */
const assetUrl = (asset: unknown): string =>
  typeof asset === 'object' && asset !== null && 'default' in asset
    ? String(asset.default)
    : String(asset);

/** The app loads its fonts through expo-font; here the bundled files become font faces. */
const fontFaces = Object.entries(FONT_ASSETS)
  .map(
    ([family, asset]) => `@font-face { font-family: '${family}'; src: url('${assetUrl(asset)}'); }`,
  )
  .join('\n');
document.head.appendChild(document.createElement('style')).textContent = fontFaces;

// Stories stay silent: components still call their sounds, the switch turns them off.
useSettingsStore.setState({ sound: false, music: false, haptics: false });

/**
 * The theme background behind the story, like the app's root stack. Components get the screen's
 * 20 pt gutter; stories with `parameters.screen` fill the frame edge to edge.
 */
function Canvas({ children, screen }: { children: ReactNode; screen: boolean }) {
  const { colors } = useTheme();

  return (
    <View style={{ minHeight: '100vh', padding: screen ? 0 : 20, backgroundColor: colors.bg }}>
      {children}
    </View>
  );
}

const withApp: Decorator = (Story, { globals, parameters }) => {
  const scheme = globals.scheme === ColorScheme.Dark ? ColorScheme.Dark : ColorScheme.Light;
  const locale = globals.locale === Locale.English ? Locale.English : Locale.German;
  if (i18n.language !== locale) void i18n.changeLanguage(locale);

  return (
    <I18nextProvider i18n={i18n}>
      <SafeAreaProvider initialMetrics={METRICS}>
        <ThemeProvider scheme={scheme}>
          <ToastProvider>
            <Canvas screen={parameters.screen === true}>
              <Story />
            </Canvas>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </I18nextProvider>
  );
};

const preview: Preview = {
  decorators: [withApp],
  globalTypes: {
    scheme: {
      description: 'Colour scheme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: ColorScheme.Light, title: 'Light' },
          { value: ColorScheme.Dark, title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'App language',
      toolbar: {
        title: 'Language',
        icon: 'globe',
        items: [
          { value: Locale.German, title: 'Deutsch' },
          { value: Locale.English, title: 'English' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { scheme: ColorScheme.Light, locale: Locale.German },
  parameters: {
    // The canvas paints the theme background and the padding itself.
    layout: 'fullscreen',
    backgrounds: { disable: true },
    controls: { matchers: { color: /(background|color)$/i } },
    viewport: {
      options: {
        phone: { name: 'Phone (390 × 844)', styles: { width: '390px', height: '844px' } },
        small: { name: 'Small phone (360 × 640)', styles: { width: '360px', height: '640px' } },
      },
    },
  },
};

export default preview;
