import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Spinner } from './Spinner';
import { Text, TextVariant } from './Text';
import { useTheme } from './theme/ThemeProvider';

type BannerProps = {
  message: string;
  /** Right-aligned extra text ("Versuch 2 von 3") or a small action. */
  trailing?: ReactNode;
};

/** The amber status banner for connection problems. */
export function Banner({ message, trailing }: BannerProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 44,
        backgroundColor: colors.accent,
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 14,
      }}
    >
      <Spinner color={colors.onAccent} size={20} strokeWidth={2.8} />
      <Text variant={TextVariant.BodyStrong} size={15} color="onAccent" style={{ flex: 1 }}>
        {message}
      </Text>
      {trailing}
    </View>
  );
}
