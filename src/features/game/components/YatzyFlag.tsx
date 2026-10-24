import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  useAnimatedValue,
  useWindowDimensions,
} from 'react-native';

import { Avatar, ColorScheme, Text, TextVariant, alpha, useTheme } from '@/ui';

import type { YatzyFlagView } from '../view';
import { FlagLetter } from './FlagLetter';
import {
  LETTER_BOX,
  STAGE_WIDTH,
  STILL_PHASE,
  STILL_SWING,
  WAVE_MS,
  layoutFlagWord,
} from './flagWave';
import { OVERLAY_Z_INDEX } from './ScreenOverlay';

const FADE_IN_MS = 180;
const UNFURL_MS = 360;
const NAME_DELAY_MS = 120;
const NAME_MS = 240;
/** The flag starts to fade this long after it appeared; a tap closes it sooner. */
const FADE_OUT_AT_MS = 2860;
const FADE_OUT_MS = 300;
const CLOSE_MS = 200;
/** The wave starts at a third of its height and grows while the word spreads out. */
const UNFURL_SWING = 0.35;
/** With reduce motion the flag only fades in and out. */
const STILL_FADE_IN_MS = 200;
const NAME_RISE = 12;

const VEIL: Record<ColorScheme, number> = { [ColorScheme.Light]: 0.88, [ColorScheme.Dark]: 0.86 };

const timing = (
  value: Animated.Value,
  toValue: number,
  duration: number,
  easing: (t: number) => number,
) => Animated.timing(value, { toValue, duration, easing, useNativeDriver: true });

type YatzyFlagProps = { flag: YatzyFlagView; onClose: () => void };

/**
 * "YATZY!" waving in the roller's colour across the whole game screen, with their avatar
 * and name below. Key it to the flag's roll so a second Yatzy starts over.
 */
export function YatzyFlag({ flag, onClose }: YatzyFlagProps) {
  const { t } = useTranslation();
  const { colors, scheme, reduceMotion } = useTheme();
  const { width } = useWindowDimensions();
  const presence = useAnimatedValue(0);
  const unfurl = useAnimatedValue(reduceMotion ? 1 : 0);
  const rise = useAnimatedValue(reduceMotion ? 1 : 0);
  const phase = useAnimatedValue(reduceMotion ? STILL_PHASE : 0);
  const swing = useMemo(
    () =>
      unfurl.interpolate({
        inputRange: [0, 1],
        outputRange: reduceMotion ? [STILL_SWING, STILL_SWING] : [UNFURL_SWING, 1],
      }),
    [unfurl, reduceMotion],
  );
  const word = t('game.yatzyFlag');
  const glyphs = useMemo(() => layoutFlagWord(word), [word]);

  useEffect(() => {
    const fadeIn = reduceMotion
      ? timing(presence, 1, STILL_FADE_IN_MS, Easing.bezier(0.4, 0, 0.2, 1))
      : timing(presence, 1, FADE_IN_MS, Easing.bezier(0.2, 0, 0, 1));
    const shown = Animated.sequence([
      fadeIn,
      Animated.delay(FADE_OUT_AT_MS - (reduceMotion ? STILL_FADE_IN_MS : FADE_IN_MS)),
      timing(presence, 0, FADE_OUT_MS, Easing.bezier(0.4, 0, 1, 1)),
    ]);
    const motion = reduceMotion
      ? []
      : [
          timing(unfurl, 1, UNFURL_MS, Easing.bezier(0.22, 1, 0.36, 1)),
          Animated.sequence([
            Animated.delay(NAME_DELAY_MS),
            timing(rise, 1, NAME_MS, Easing.bezier(0.2, 0, 0, 1)),
          ]),
          Animated.loop(timing(phase, 1, WAVE_MS, Easing.linear)),
        ];
    shown.start(({ finished }) => {
      if (finished) onClose();
    });
    motion.forEach((animation) => animation.start());

    return () => {
      shown.stop();
      motion.forEach((animation) => animation.stop());
    };
  }, [presence, unfurl, rise, phase, reduceMotion, onClose]);

  // A tap cuts the wave short; stopping the timeline keeps it from closing a second time.
  const close = () => {
    presence.stopAnimation();
    timing(presence, 0, CLOSE_MS, Easing.bezier(0.4, 0, 1, 1)).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.overlay,
        { backgroundColor: alpha(colors.bg, VEIL[scheme]), opacity: presence },
      ]}
    >
      <Pressable
        style={styles.content}
        onPress={close}
        accessibilityRole="button"
        accessibilityLabel={`${word} ${flag.name}`}
      >
        <View style={[styles.stage, { transform: [{ scale: Math.min(1, width / STAGE_WIDTH) }] }]}>
          {glyphs.map((glyph, i) => (
            <FlagLetter
              key={i}
              glyph={glyph}
              color={flag.color}
              unfurl={unfurl}
              phase={phase}
              swing={swing}
            />
          ))}
        </View>
        <Animated.View
          style={[
            styles.player,
            {
              opacity: rise,
              transform: [
                {
                  translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [NAME_RISE, 0] }),
                },
              ],
            },
          ]}
        >
          <Avatar initial={flag.initial} color={flag.color} size={76} />
          <Text variant={TextVariant.Hero} size={32} numberOfLines={1}>
            {flag.name}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { zIndex: OVERLAY_Z_INDEX },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  // The design's gap between the word and the avatar.
  stage: { width: STAGE_WIDTH, height: LETTER_BOX, marginBottom: 53 },
  player: { alignItems: 'center', gap: 14 },
});
