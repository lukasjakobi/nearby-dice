import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { useTheme } from './theme/ThemeProvider';

/** The bordered action area pinned below a screen's scrolling content. */
export function Footer({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 24,
          gap: 12,
          borderTopWidth: 1,
          borderTopColor: colors.line,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
