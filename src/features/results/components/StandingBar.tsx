import { useEffect } from 'react';
import { Animated, Easing, StyleSheet, useAnimatedValue, View } from 'react-native';

import { mix, Text, useTheme } from '@/ui';

import { BarPart } from '../view';
import type { Standing } from '../view';
import { BAR_COLORS } from './barColors';

const OUTER = 10;
const INNER = 4;

type StandingBarProps = {
  row: Standing;
  /** The colour behind the bar, which its track is tinted from. */
  background: string;
  /** Place in the list: each bar grows a little after the one above. */
  index: number;
};

/** Upper block, bonus and the rest side by side, as long as the points against the winner's. */
export function StandingBar({ row, background, index }: StandingBarProps) {
  const { colors, reduceMotion } = useTheme();
  const progress = useAnimatedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);

      return;
    }

    Animated.timing(progress, {
      toValue: 1,
      duration: 600,
      delay: index * 80,
      easing: Easing.bezier(0.2, 0, 0, 1),
      useNativeDriver: true,
    }).start();
  }, [index, progress, reduceMotion]);
  const last = row.segments.length - 1;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={row.barLabel}
      style={[styles.track, { backgroundColor: mix(colors.ink, background, 0.07) }]}
    >
      <Animated.View
        style={[styles.bar, { width: `${row.barWidth}%`, transform: [{ scaleX: progress }] }]}
      >
        {row.segments.map((segment, i) => {
          const { fill, label } = BAR_COLORS[segment.part](colors);

          return (
            <View
              key={segment.part}
              style={[
                styles.segment,
                {
                  flexGrow: segment.points,
                  minWidth: segment.part === BarPart.Bonus ? 30 : 24,
                  backgroundColor: fill,
                  borderTopLeftRadius: i === 0 ? OUTER : INNER,
                  borderBottomLeftRadius: i === 0 ? OUTER : INNER,
                  borderTopRightRadius: i === last ? OUTER : INNER,
                  borderBottomRightRadius: i === last ? OUTER : INNER,
                },
              ]}
            >
              <Text size={13} weight={600} color={{ raw: label }} numberOfLines={1}>
                {segment.label}
              </Text>
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 26, borderRadius: OUTER },
  bar: { flexDirection: 'row', gap: 2, height: 26, transformOrigin: 'left' },
  segment: {
    flexShrink: 1,
    flexBasis: 0,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
