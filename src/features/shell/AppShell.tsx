import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useStoresHydrated } from '@/store';
import { useAppAudio } from '@/shared';
import {
  ColorScheme,
  FONT_ASSETS,
  PALETTES,
  setSystemFontFallback,
  ThemeProvider,
  ToastProvider,
} from '@/ui';

import { LaunchSplash } from './components';
import { useAppLanguage, useColorScheme } from './hooks';

void SplashScreen.preventAutoHideAsync();

/** Fonts, persisted data, theme, language, toasts and the root stack. */
export function AppShell() {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const hydrated = useStoresHydrated();
  setSystemFontFallback(fontError !== null && fontError !== undefined);
  const scheme = useColorScheme();
  useAppLanguage();
  const background = PALETTES[scheme].bg;
  const ready = (fontsLoaded || (fontError !== null && fontError !== undefined)) && hydrated;
  useAppAudio(ready);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(background);
  }, [background]);

  useEffect(() => {
    if (!ready) return;
    void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider scheme={scheme}>
        <ToastProvider>
          <StatusBar style={scheme === ColorScheme.Dark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: background } }}
          />
          <LaunchSplash />
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
