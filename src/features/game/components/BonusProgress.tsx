import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, useAnimatedValue } from 'react-native';

import { Icon, IconName, Pop, Text, alpha, useTheme } from '@/ui';

import type { SheetView } from '../view';

type BonusProgressProps = { bonus: NonNullable<SheetView['bonus']> };

const TRACK = 8;

/**
 * Upper block: "Bonus (+35)" with how far the upper sum has got to the threshold. The fill
 * glides to each new sum; once reached the card turns primary with a check mark.
 */
export function BonusProgress({ bonus }: BonusProgressProps) {
  const { colors, reduceMotion } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const fill = useAnimatedValue(bonus.fraction);
  useEffect(() => {
    Animated.timing(fill, {
      toValue: bonus.fraction,
      duration: reduceMotion ? 0 : 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fill, bonus.fraction, reduceMotion]);
  // A full-width fill slid in from the left keeps its rounded tip at every fraction.
  const translateX = fill.interpolate({ inputRange: [0, 1], outputRange: [-trackWidth, 0] });

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={bonus.label}
      accessibilityValue={{ text: bonus.progress }}
      style={[
        styles.bonus,
        { backgroundColor: bonus.reached ? alpha(colors.primary, 0.14) : colors.surface2 },
      ]}
    >
      <View style={styles.bonusRow}>
        <View style={styles.title}>
          {bonus.reached ? (
            <Pop>
              <Icon name={IconName.CheckCircle} color={colors.primary} size={15} />
            </Pop>
          ) : null}
          <Text size={13} weight={600} color={bonus.reached ? 'primary' : 'ink'}>
            {bonus.label}
          </Text>
        </View>
        <Text size={13} weight={600} color={bonus.reached ? 'primary' : 'muted'}>
          {bonus.progress}
        </Text>
      </View>
      <View
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        style={[styles.track, { backgroundColor: alpha(colors.ink, 0.08) }]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              opacity: trackWidth ? 1 : 0,
              backgroundColor: colors.primary,
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bonus: { gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12 },
  bonusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  track: { height: TRACK, borderRadius: TRACK / 2, overflow: 'hidden' },
  fill: { width: '100%', height: '100%', borderRadius: TRACK / 2 },
});
