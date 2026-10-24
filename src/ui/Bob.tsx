import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Animated, Easing, useAnimatedValue } from 'react-native';

import { useTheme } from './theme/ThemeProvider';

/** Gentle floating loop (logo, onboarding dice). Static with reduce motion. */
export function Bob({
  children,
  tilt = 0,
  delayMs = 0,
  distance = 6,
}: {
  children: ReactNode;
  tilt?: number;
  delayMs?: number;
  distance?: number;
}) {
  const { reduceMotion } = useTheme();
  const progress = useAnimatedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
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
  }, [delayMs, progress, reduceMotion]);
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] });

  return (
    <Animated.View style={{ transform: [{ translateY }, { rotate: `${tilt}deg` }] }}>
      {children}
    </Animated.View>
  );
}
