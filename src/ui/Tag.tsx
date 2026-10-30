import { View } from 'react-native';

import { Text } from './Text';
import { useTheme } from './theme/ThemeProvider';
import { RADIUS } from './theme/tokens';
import type { ColorToken } from './theme/tokens';

type TagProps = { label: string; background: ColorToken; color: ColorToken };

/** A tiny label next to a name: "Host", "Du". */
export function Tag({ label, background, color }: TagProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: RADIUS.pill,
        backgroundColor: colors[background],
      }}
    >
      <Text size={11} weight={600} color={color}>
        {label}
      </Text>
    </View>
  );
}
