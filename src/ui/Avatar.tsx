import { View } from 'react-native';

import { Text } from './Text';
import { useTheme } from './theme/ThemeProvider';
import { FIXED } from './theme/tokens';
import { Font, fontFamily } from './theme/typography';

type AvatarProps = {
  initial: string;
  /** Player colour as hex. */
  color: string;
  size?: number;
  /** Large profile preview: surface ring plus a thin outline. */
  framed?: boolean;
  dimmed?: boolean;
};

/** A player's initial on their colour. Text on player colours is always dark. */
export function Avatar({ initial, color, size = 44, framed = false, dimmed = false }: AvatarProps) {
  const { colors } = useTheme();

  return (
    <View
      accessible={false}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: dimmed ? 0.45 : 1,
        borderWidth: framed ? 4 : 0,
        borderColor: colors.surface,
        outlineWidth: framed ? 2 : 0,
        outlineColor: colors.line,
        flexShrink: 0,
      }}
    >
      <Text
        color={{ raw: FIXED.onPlayer }}
        size={Math.round(size * 0.45)}
        style={{ fontFamily: fontFamily(Font.Display, 700) }}
      >
        {initial}
      </Text>
    </View>
  );
}
