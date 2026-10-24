import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Animated, Easing, useAnimatedValue } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { useTheme } from './theme/ThemeProvider';

/** Screen content fades in from 8 pt below over 250 ms (instant with reduce motion). */
export function FadeIn({
  children,
  style,
  delayMs = 0,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Waits this long before appearing, also with reduce motion. */
  delayMs?: number;
}) {
  const { reduceMotion } = useTheme();
  const progress = useAnimatedValue(reduceMotion && !delayMs ? 1 : 0);
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      delay: delayMs,
      duration: reduceMotion ? 0 : 250,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [progress, reduceMotion, delayMs]);
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });

  return (
    <Animated.View style={[{ opacity: progress, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}
