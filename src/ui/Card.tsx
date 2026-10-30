import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { useTheme } from './theme/ThemeProvider';
import { RADIUS } from './theme/tokens';
import type { ColorToken } from './theme/tokens';

type CardProps = {
  children: ReactNode;
  /** Border colour token; dashed for empty slots. */
  border?: ColorToken;
  dashed?: boolean;
  padding?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Card({
  children,
  border = 'line',
  dashed = false,
  padding = 14,
  radius = RADIUS.card,
  style,
}: CardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors[border],
          borderWidth: dashed ? 1.5 : 1,
          borderStyle: dashed ? 'dashed' : 'solid',
          borderRadius: radius,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
