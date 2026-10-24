import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';

import { ColorScheme, PALETTES } from './tokens';
import type { Palette } from './tokens';

export type Theme = {
  scheme: ColorScheme;
  colors: Palette;
  /** OS "reduce motion": replace shakes and fades with instant changes. */
  reduceMotion: boolean;
};

const ThemeContext = createContext<Theme>({
  scheme: ColorScheme.Light,
  colors: PALETTES[ColorScheme.Light],
  reduceMotion: false,
});

export function ThemeProvider({ scheme, children }: { scheme: ColorScheme; children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => subscription.remove();
  }, []);
  const theme = useMemo(
    () => ({ scheme, colors: PALETTES[scheme], reduceMotion }),
    [scheme, reduceMotion],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
