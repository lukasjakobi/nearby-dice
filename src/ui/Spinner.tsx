import { useEffect } from 'react';
import { Animated, Easing, useAnimatedValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from './theme/ThemeProvider';

type SpinnerProps = { color: string; size?: number; strokeWidth?: number; label?: string };

/** The arc spinner from the design; rotates once per second. */
export function Spinner({ color, size = 20, strokeWidth = 2.6, label }: SpinnerProps) {
  const { reduceMotion } = useTheme();
  const rotation = useAnimatedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();

    return () => loop.stop();
  }, [reduceMotion, rotation]);
  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      style={{ width: size, height: size, transform: [{ rotate }] }}
      accessible={!!label}
      accessibilityLabel={label}
      accessibilityRole={label ? 'progressbar' : undefined}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 3a9 9 0 1 0 9 9"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
}
