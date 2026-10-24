import { useColorScheme as useSystemScheme } from 'react-native';

import { ThemeMode, useSettingsStore } from '@/store';
import { ColorScheme } from '@/ui';

/** "Hell" / "Dunkel" / "System" from Settings, resolved against the OS. */
export function useColorScheme(): ColorScheme {
  const mode = useSettingsStore((s) => s.themeMode);
  const system = useSystemScheme() === 'dark' ? ColorScheme.Dark : ColorScheme.Light;
  const resolved: Record<ThemeMode, ColorScheme> = {
    [ThemeMode.Light]: ColorScheme.Light,
    [ThemeMode.Dark]: ColorScheme.Dark,
    [ThemeMode.System]: system,
  };

  return resolved[mode];
}
