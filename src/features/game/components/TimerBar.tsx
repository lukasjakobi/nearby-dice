import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, useAnimatedValue } from 'react-native';

import { FIXED, Text } from '@/ui';

export type Timer = { deadline: number; limitMs: number; lowMs: number };

/**
 * Time left on the current turn, mine or someone else's: drawn the same either way and
 * purely visual (no sound or vibration). Runs on the native driver from the deadline,
 * so it shrinks smoothly without re-rendering the screen; turns red for the last `lowMs`.
 * The whole seconds left sit beside the bar and change on each second boundary.
 */
export function TimerBar({ deadline, limitMs, lowMs }: Timer) {
  const { t } = useTranslation();
  const left = useAnimatedValue(1);
  const [leftMs, setLeftMs] = useState(limitMs);
  // Redraws only on each whole second, so the number changes exactly when it should.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      const ms = Math.max(0, deadline - Date.now());
      setLeftMs(ms);
      if (ms > 0) timer = setTimeout(tick, ms % 1000 || 1000);
    };

    tick();

    return () => clearTimeout(timer);
  }, [deadline]);
  const percent = Math.round((leftMs / limitMs) * 100);
  const seconds = Math.ceil(leftMs / 1000);
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
  const isLow = leftMs <= lowMs;

  return (
    <View style={styles.row}>
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
      <Text
        size={13}
        weight={600}
        align="right"
        color={{ raw: isLow ? FIXED.timeLow : FIXED.onFelt }}
        style={styles.seconds}
      >
        {seconds}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timerTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  timerFill: { height: '100%', width: '100%', transformOrigin: 'left' },
  seconds: { minWidth: 24 },
});
