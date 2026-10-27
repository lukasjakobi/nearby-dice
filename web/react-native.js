// The web build's `react-native`: react-native-web plus the newer React Native APIs it lacks.
import { useRef } from 'react';
import { Animated } from 'react-native-web/dist/index';

export * from 'react-native-web/dist/index';

/** React Native's `useAnimatedValue`: one `Animated.Value` for the component's lifetime. */
export function useAnimatedValue(initialValue, config) {
  const ref = useRef(null);
  ref.current ??= new Animated.Value(initialValue, config);

  return ref.current;
}
