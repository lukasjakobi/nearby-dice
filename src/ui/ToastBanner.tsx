import { useEffect } from 'react';
import { Animated, Easing, useAnimatedValue } from 'react-native';

import { Text, TextVariant } from './Text';
import { useTheme } from './theme/ThemeProvider';
import { RADIUS } from './theme/tokens';

const ENTER_MS = 220;
const EXIT_MS = 180;
/** How far the card travels from the top edge while it drops in or lifts out. */
const TRAVEL = 12;

type ToastBannerProps = {
  message: string;
  /** False fades the card out; `onExited` fires once it is gone. */
  visible: boolean;
  onExited: () => void;
};

/** A quiet card that drops in below the status bar and lifts away before it is removed. */
export function ToastBanner({ message, visible, onExited }: ToastBannerProps) {
  const { colors, reduceMotion } = useTheme();
  const progress = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: reduceMotion ? 0 : visible ? ENTER_MS : EXIT_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) onExited();
    });

    // A replaced or unmounted card must not report its exit, or it would clear the next toast.
    return () => progress.stopAnimation();
  }, [progress, visible, reduceMotion, onExited]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-TRAVEL, 0] });

  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        opacity: progress,
        transform: [{ translateY }],
        maxWidth: 420,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: RADIUS.card,
        paddingVertical: 10,
        paddingHorizontal: 16,
        shadowColor: colors.ink,
        shadowOpacity: 0.16,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      }}
    >
      <Text variant={TextVariant.BodyStrong} size={15} color="ink" style={{ textAlign: 'center' }}>
        {message}
      </Text>
    </Animated.View>
  );
}
