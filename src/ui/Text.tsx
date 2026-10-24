import { Text as RNText } from 'react-native';
import type { TextProps as RNTextProps, TextStyle } from 'react-native';

import { useTheme } from './theme/ThemeProvider';
import type { ColorToken } from './theme/tokens';
import { MAX_FONT_SCALE, TEXT_VARIANTS, TextVariant, fontFamily } from './theme/typography';
import type { FontWeight } from './theme/typography';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  /** A palette token, or a raw colour for text on fixed surfaces (felt, player colours). */
  color?: ColorToken | { raw: string };
  size?: number;
  weight?: FontWeight;
  align?: TextStyle['textAlign'];
};

/** All text goes through here: fonts per weight, tabular numbers, Dynamic Type cap. */
export function Text({
  variant = TextVariant.Body,
  color = 'ink',
  size,
  weight,
  align,
  style,
  ...props
}: TextProps) {
  const { colors } = useTheme();
  const base = TEXT_VARIANTS[variant];
  const fontSize = size ?? base.size;

  return (
    <RNText
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      style={[
        {
          fontFamily: fontFamily(base.font, weight ?? base.weight),
          fontSize,
          lineHeight: size ? Math.round(size * 1.2) : base.lineHeight,
          color: typeof color === 'string' ? colors[color] : color.raw,
          textAlign: align,
          fontVariant: ['tabular-nums'],
        },
        style,
      ]}
      {...props}
    />
  );
}

export { TextVariant };
