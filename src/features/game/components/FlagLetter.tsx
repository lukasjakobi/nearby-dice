import { useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { ColorScheme, FIXED, Font, Text, fontFamily, mix, useTheme } from '@/ui';

import {
  DROP_SHADOW,
  EXTRUSION,
  FONT_SIZE,
  LETTER_BOX,
  STAGE_WIDTH,
  WAVE_PHASES,
  glyphWave,
} from './flagWave';
import type { FlagGlyph } from './flagWave';

type FlagLetterProps = {
  glyph: FlagGlyph;
  /** Player colour as hex. */
  color: string;
  /** 0 → 1 while the word spreads out from its middle. */
  unfurl: Animated.Value;
  /** Wave phase, 0 → 1 per swing. */
  phase: Animated.Value;
  /** How high the wave runs, as a share of its full height. */
  swing: Animated.AnimatedInterpolation<number>;
};

const SHADOW_OPACITY: Record<ColorScheme, number> = {
  [ColorScheme.Light]: 0.28,
  [ColorScheme.Dark]: 0.5,
};

/** One solid letter of the flag, riding the wave beneath its centre. */
export function FlagLetter({ glyph, color, unfurl, phase, swing }: FlagLetterProps) {
  const { scheme } = useTheme();
  const motion = useMemo(() => {
    const wave = glyphWave(glyph);
    const onWave = (outputRange: number[]) =>
      Animated.multiply(phase.interpolate({ inputRange: WAVE_PHASES, outputRange }), swing);

    return {
      transform: [
        { translateX: unfurl.interpolate({ inputRange: [0, 1], outputRange: [-glyph.offset, 0] }) },
        { translateY: onWave(wave.lift) },
        { scaleX: unfurl.interpolate({ inputRange: [0, 1], outputRange: [0.02, 1] }) },
      ],
      dark: onWave(wave.dark),
      light: onWave(wave.light),
    };
  }, [glyph, unfurl, phase, swing]);

  const extrusion = mix(color, FIXED.onPlayer, 0.52);
  // Back to front: drop shadow, the solid sides, then the face.
  const layers = [
    { ...DROP_SHADOW, raw: FIXED.flagShadow, opacity: SHADOW_OPACITY[scheme] },
    ...EXTRUSION.map((at) => ({ ...at, raw: extrusion, opacity: 1 })),
    { x: 0, y: 0, raw: color, opacity: 1 },
  ];
  const glyphIn = (raw: string) => (
    <Text color={{ raw }} allowFontScaling={false} style={styles.char}>
      {glyph.char}
    </Text>
  );

  return (
    <Animated.View
      style={[
        styles.letter,
        { left: STAGE_WIDTH / 2 + glyph.offset - LETTER_BOX / 2, transform: motion.transform },
      ]}
    >
      {layers.map(({ x, y, raw, opacity }, i) => (
        <View key={i} style={[styles.glyph, { left: x, top: y, opacity }]}>
          {glyphIn(raw)}
        </View>
      ))}
      <Animated.View style={[styles.glyph, { opacity: motion.dark }]}>
        {glyphIn(FIXED.onPlayer)}
      </Animated.View>
      <Animated.View style={[styles.glyph, { opacity: motion.light }]}>
        {glyphIn(FIXED.flagLight)}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  letter: { position: 'absolute', top: 0, width: LETTER_BOX, height: LETTER_BOX },
  glyph: {
    position: 'absolute',
    width: LETTER_BOX,
    height: LETTER_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  char: {
    fontFamily: fontFamily(Font.Display, 700),
    fontSize: FONT_SIZE,
    lineHeight: Math.round(FONT_SIZE * 1.2),
    includeFontPadding: false,
  },
});
