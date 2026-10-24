import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Animated, useAnimatedValue } from 'react-native';

import { useTheme } from './theme/ThemeProvider';

/** Pops in from 70 % with a small overshoot, e.g. each number of the countdown. Key it to replay. */
export function Pop({ children }: { children: ReactNode }) {
  const { reduceMotion } = useTheme();
  const progress = useAnimatedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (reduceMotion) return;
    Animated.spring(progress, {
      toValue: 1,
      stiffness: 420,
      damping: 18,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [progress, reduceMotion]);
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const opacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });

  return <Animated.View style={{ opacity, transform: [{ scale }] }}>{children}</Animated.View>;
}
