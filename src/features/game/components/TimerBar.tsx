import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, useAnimatedValue } from 'react-native';

import { FIXED } from '@/ui';

export type Timer = { deadline: number; limitMs: number; lowMs: number };

/**
 * Time left on the current turn, mine or someone else's: drawn the same either way and
 * purely visual (no sound or vibration). Runs on the native driver from the deadline,
 * so it shrinks smoothly without re-rendering the screen; turns red for the last `lowMs`.
 */
export function TimerBar({ deadline, limitMs, lowMs }: Timer) {
  const { t } = useTranslation();
  const left = useAnimatedValue(1);
  // Whole percent for screen readers, refreshed once a second.
  const [percent, setPercent] = useState(100);
  useEffect(() => {
    const update = () =>
      setPercent(Math.round((Math.max(0, deadline - Date.now()) / limitMs) * 100));
    const timer = setInterval(update, 1000);

    return () => clearInterval(timer);
  }, [deadline, limitMs]);
  useEffect(() => {
    const ms = Math.max(0, deadline - Date.now());
    left.setValue(Math.min(1, ms / limitMs));
    const run = Animated.timing(left, {
      toValue: 0,
      duration: ms,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    run.start();

    return () => run.stop();
  }, [deadline, limitMs, left]);
  const low = Math.min(1, lowMs / limitMs);
  const lowOpacity = left.interpolate({
    inputRange: [low - 0.0001, low],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const fill = [styles.timerFill, { transform: [{ scaleX: left }] }];

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={t('game.timeLeft')}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={styles.timerTrack}
    >
      <Animated.View style={[fill, { backgroundColor: FIXED.onFelt }]} />
      <Animated.View
        style={[
          fill,
          StyleSheet.absoluteFill,
          { backgroundColor: FIXED.timeLow, opacity: lowOpacity },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  timerTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  timerFill: { height: '100%', width: '100%', transformOrigin: 'left' },
});
