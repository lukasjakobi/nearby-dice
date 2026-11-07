import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Animated, Easing, useAnimatedValue } from 'react-native';

import { useTheme } from './theme/ThemeProvider';

/** Settling back to rest once the float stops. */
const SETTLE_MS = 120;

/**
 * Gentle floating loop (logo, onboarding dice, unrolled dice). Static with reduce motion.
 * Turning `active` off settles the child back to rest without remounting it.
 */
export function Bob({
  children,
  tilt = 0,
  delayMs = 0,
  distance = 6,
  active = true,
}: {
  children: ReactNode;
  tilt?: number;
  delayMs?: number;
  distance?: number;
  active?: boolean;
}) {
  const { reduceMotion } = useTheme();
  const progress = useAnimatedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    if (!active) {
      Animated.timing(progress, {
        toValue: 0,
        duration: SETTLE_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();

      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delayMs),
        Animated.timing(progress, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();

    return () => loop.stop();
  }, [active, delayMs, progress, reduceMotion]);
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] });

  return (
    <Animated.View style={{ transform: [{ translateY }, { rotate: `${tilt}deg` }] }}>
      {children}
    </Animated.View>
  );
}
