import { useEffect } from 'react';
import { Animated, useAnimatedValue } from 'react-native';

import { useTheme } from '@/ui';

/** The blinking caret in the empty code box (static when reduce motion is on). */
export function Caret() {
  const { colors, reduceMotion } = useTheme();
  const opacity = useAnimatedValue(1);
  useEffect(() => {
    if (reduceMotion) return;
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 0, delay: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 0, delay: 500, useNativeDriver: true }),
      ]),
    );
    blink.start();

    return () => blink.stop();
  }, [opacity, reduceMotion]);

  return (
    <Animated.View
      style={{ width: 3, height: 44, borderRadius: 2, backgroundColor: colors.primary, opacity }}
    />
  );
}
