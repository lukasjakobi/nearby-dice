import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '@/ui';

/** The tray the dice sit on. */
export function FeltTray({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.felt,
          borderRadius: 24,
          padding: 16,
          borderWidth: 3,
          borderColor: 'rgba(255,255,255,0.08)',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
