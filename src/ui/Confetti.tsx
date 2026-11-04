import { useEffect } from 'react';
import { Animated, Easing, View, useAnimatedValue } from 'react-native';

import { useTheme } from './theme/ThemeProvider';

import { PLAYER_COLOR_HEX } from './theme/tokens';

const COLORS = Object.values(PLAYER_COLOR_HEX);

/**
 * Where each piece lies, as a share of the box (left, top), its turn and whether it is a dot or a
 * strip. Fixed, so a screenshot and the next look are the same; the pieces keep to the top half,
 * around the winner's avatar and clear of the headline below it, however long the name.
 */
const PIECES: [number, number, number, boolean][] = [
  [0.04, 0.08, -20, false],
  [0.12, 0.3, 35, true],
  [0.2, 0.02, 60, false],
  [0.06, 0.44, 0, true],
  [0.24, 0.22, -40, false],
  [0.32, 0.04, 15, true],
  [0.68, 0.06, 25, false],
  [0.76, 0.26, -30, true],
  [0.88, 0.04, 50, false],
  [0.94, 0.34, -10, true],
  [0.84, 0.46, 15, false],
  [0.16, 0.5, 80, false],
];

const FALL_MS = 900;

/**
 * Dots and strips in the player colours behind a celebration, dropping into place once. Purely
 * decorative; with reduced motion they are simply there.
 */
export function Confetti({ scale = 1 }: { scale?: number }) {
  const { reduceMotion } = useTheme();
  const fall = useAnimatedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (reduceMotion) return;
    Animated.timing(fall, {
      toValue: 1,
      duration: FALL_MS,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: true,
    }).start();
  }, [fall, reduceMotion]);

  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', inset: 0 }}
    >
      {PIECES.map(([left, top, turn, strip], i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: `${left * 100}%`,
            top: `${top * 100}%`,
            width: (strip ? 18 : 11) * scale,
            height: (strip ? 6 : 11) * scale,
            borderRadius: strip ? 3 : 6 * scale,
            backgroundColor: COLORS[i % COLORS.length],
            opacity: fall.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
            transform: [
              // Higher pieces fall from further up, so the shower doesn't land as one block.
              {
                translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [-60 - i * 8, 0] }),
              },
              { rotate: `${turn}deg` },
            ],
          }}
        />
      ))}
    </View>
  );
}
