import { useEffect, useState } from 'react';
import { Animated, Easing, useAnimatedValue } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

import { useTheme } from './theme/ThemeProvider';
import { FIXED } from './theme/tokens';

/** Pip positions on a 56×56 die, per face. */
const PIPS: Record<number, [number, number][]> = {
  1: [[28, 28]],
  2: [
    [17, 17],
    [39, 39],
  ],
  3: [
    [17, 17],
    [28, 28],
    [39, 39],
  ],
  4: [
    [17, 17],
    [39, 17],
    [17, 39],
    [39, 39],
  ],
  5: [
    [17, 17],
    [39, 17],
    [28, 28],
    [17, 39],
    [39, 39],
  ],
  6: [
    [17, 15],
    [39, 15],
    [17, 28],
    [39, 28],
    [17, 41],
    [39, 41],
  ],
};

const SHAKE_MS = 160;
/** While shaking, the die tumbles through random faces this often. */
const TUMBLE_MS = 55;

function randomFace(not: number): number {
  const face = 1 + Math.floor(Math.random() * 5);

  return face >= not ? face + 1 : face;
}

type DieFaceProps = {
  /** 1–6, or 0 for the translucent placeholder before the first roll. */
  value: number;
  size?: number;
  held?: boolean;
  /** Increment to shake the die once (2 × 160 ms). */
  shakeKey?: number;
  tilt?: number;
  /** Lifts held dice by 8 pt. */
  lift?: boolean;
};

/** A die with the design's pips, held ring, tilt and shake. Purely visual. */
export function DieFace({
  value,
  size = 56,
  held = false,
  shakeKey = 0,
  tilt = 0,
  lift = true,
}: DieFaceProps) {
  const { reduceMotion } = useTheme();
  const shake = useAnimatedValue(0);
  const raise = useAnimatedValue(held ? 1 : 0);
  // A random face shown while the die shakes; `null` once it has landed.
  const [tumble, setTumble] = useState<number | null>(null);

  useEffect(() => {
    if (!shakeKey || reduceMotion) return;
    shake.setValue(0);
    Animated.timing(shake, {
      toValue: 2,
      duration: SHAKE_MS * 2,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
    const flip = () => setTumble((face) => randomFace(face ?? 0));
    flip();
    const flips = setInterval(flip, TUMBLE_MS);
    // The real face usually replaces the tumble when the new value arrives (below);
    // this covers a die that lands on the face it already showed.
    const stop = setTimeout(
      () => {
        clearInterval(flips);
        setTumble(null);
      },
      SHAKE_MS * 2 + 40,
    );

    return () => {
      clearInterval(flips);
      clearTimeout(stop);
    };
  }, [shakeKey, reduceMotion, shake]);

  useEffect(() => {
    const toValue = held ? 1 : 0;
    if (reduceMotion) {
      raise.setValue(toValue);

      return;
    }

    // Stiff, slightly underdamped spring: moves on the first frame and lands with a small pop,
    // so the lift keeps up with the held ring, which changes instantly.
    Animated.spring(raise, {
      toValue,
      stiffness: 700,
      damping: 32,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [held, reduceMotion, raise]);

  const cycle = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const translateX = shake.interpolate({
    inputRange: cycle,
    outputRange: [0, -2, 2.5, -1.5, 0, -2, 2.5, -1.5, 0],
  });
  const shakeY = shake.interpolate({
    inputRange: cycle,
    outputRange: [0, -3, 1.5, 2.5, 0, -3, 1.5, 2.5, 0],
  });
  const shakeRotate = shake.interpolate({
    inputRange: cycle,
    outputRange: ['0deg', '-7deg', '6deg', '-4deg', '0deg', '-7deg', '6deg', '-4deg', '0deg'],
  });
  const liftY = raise.interpolate({ inputRange: [0, 1], outputRange: [0, lift ? -8 : 0] });
  const rest = raise.interpolate({ inputRange: [0, 1], outputRange: [`${tilt}deg`, '0deg'] });

  // The new value has landed: show it for the rest of this shake instead of random faces.
  const [landed, setLanded] = useState({ value, shakeKey });
  if (landed.value !== value) setLanded({ value, shakeKey });
  const tumbling = tumble !== null && landed.shakeKey !== shakeKey;

  const face = tumbling ? tumble : value;
  const placeholder = face === 0;
  const pips = PIPS[placeholder ? 5 : face] ?? [];

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        transform: [
          { translateY: Animated.add(liftY, shakeY) },
          { translateX },
          { rotate: rest },
          { rotate: shakeRotate },
        ],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 56 56">
        <Rect
          x={3}
          y={3}
          width={50}
          height={50}
          rx={13}
          fill={placeholder ? 'rgba(255,252,245,0.12)' : FIXED.dieFace}
          stroke={held ? FIXED.heldRing : placeholder ? 'rgba(255,255,255,0.4)' : FIXED.dieEdge}
          strokeWidth={held ? 4 : 1.5}
        />
        {pips.map(([cx, cy], i) => (
          <Circle
            key={i}
            cx={cx}
            cy={cy}
            r={4.6}
            fill={placeholder ? 'rgba(255,252,245,0.4)' : FIXED.diePip}
          />
        ))}
      </Svg>
    </Animated.View>
  );
}
