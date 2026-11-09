import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Modal } from 'react-native';
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

import { CrashBoundary, CrashView, LaunchSplash } from './components';
import { leaveForHome, useAppLanguage, useColorScheme, useUncaughtErrors } from './hooks';

void SplashScreen.preventAutoHideAsync();

/** Each screen crashes on its own, so the stack stays mounted and can still go back to Start. */
const screenLayout = ({ children }: { children: ReactNode }) => (
  <CrashBoundary>{children}</CrashBoundary>
);

/** Fonts, persisted data, theme, language, toasts, crash recovery and the root stack. */
export function AppShell() {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const hydrated = useStoresHydrated();
  setSystemFontFallback(fontError !== null && fontError !== undefined);
  const scheme = useColorScheme();
  useAppLanguage();
  const background = PALETTES[scheme].bg;
  const ready = (fontsLoaded || (fontError !== null && fontError !== undefined)) && hydrated;
  useAppAudio(ready);
  const uncaught = useUncaughtErrors();

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
            screenLayout={screenLayout}
          />
          {/* Mounted only when needed, so it opens above any sheet or dialog that is showing. */}
          {uncaught.fatal ? (
            <Modal
              visible
              animationType="none"
              onRequestClose={uncaught.dismiss}
              statusBarTranslucent
            >
              <CrashView
                onRetry={uncaught.dismiss}
                onHome={() => {
                  uncaught.dismiss();
                  leaveForHome();
                }}
              />
            </Modal>
          ) : null}
          <LaunchSplash />
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
