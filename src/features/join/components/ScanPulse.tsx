import { useEffect } from 'react';
import { Animated, Easing, View, useAnimatedValue } from 'react-native';

import { IconBadge, IconName, Text, TextVariant, useTheme } from '@/ui';

const SIZE = 132;

/** While the scan finds nothing yet: a radar ring pulsing out from the broadcast icon. */
export function ScanPulse({ label }: { label: string }) {
  const { colors, reduceMotion } = useTheme();
  const pulse = useAnimatedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    // Back to the centre after each ring, so the pulse keeps going for as long as the search.
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();

    return () => loop.stop();
  }, [pulse, reduceMotion]);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}
    >
      <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
        {[0.55, 0.8, 1].map((scale) => (
          <View
            key={scale}
            style={{
              position: 'absolute',
              width: SIZE * scale,
              height: SIZE * scale,
              borderRadius: SIZE,
              borderWidth: 1.5,
              borderColor: colors.line,
            }}
          />
        ))}
        <Animated.View
          style={{
            position: 'absolute',
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE,
            borderWidth: 2,
            borderColor: colors.primary,
            opacity: reduceMotion
              ? 0
              : pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
            transform: [
              { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
            ],
          }}
        />
        <IconBadge icon={IconName.Broadcast} color={colors.primary} size={56} />
      </View>
      <Text variant={TextVariant.Caption} color="muted">
        {label}
      </Text>
    </View>
  );
}
