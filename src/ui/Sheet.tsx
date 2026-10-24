import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  View,
  useAnimatedValue,
  useWindowDimensions,
} from 'react-native';
import type { DimensionValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, TextVariant } from './Text';
import { useTheme } from './theme/ThemeProvider';
import { RADIUS } from './theme/tokens';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** Element shown next to the title (e.g. a close button). */
  titleAccessory?: ReactNode;
  children: ReactNode;
  height?: DimensionValue;
  centered?: boolean;
};

const CLOSE_MS = 180;

/**
 * Bottom sheet over a scrim. Tapping the scrim or Back closes it. The scrim fades
 * while the sheet springs up from the bottom edge, and both reverse on close.
 */
export function Sheet({
  visible,
  onClose,
  title,
  titleAccessory,
  children,
  height,
  centered,
}: SheetProps) {
  const { colors, reduceMotion } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const progress = useAnimatedValue(0);
  // Stays mounted while the close animation runs.
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);
  if (!visible && mounted && reduceMotion) setMounted(false);

  useEffect(() => {
    if (visible) {
      if (reduceMotion) {
        progress.setValue(1);

        return;
      }

      const open = Animated.spring(progress, {
        toValue: 1,
        stiffness: 380,
        damping: 36,
        mass: 1,
        useNativeDriver: true,
      });
      open.start();

      return () => open.stop();
    }

    if (reduceMotion) {
      progress.setValue(0);

      return;
    }

    const close = Animated.timing(progress, {
      toValue: 0,
      duration: CLOSE_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    });
    close.start(({ finished }) => finished && setMounted(false));

    return () => close.stop();
  }, [visible, reduceMotion, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [windowHeight, 0] });

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: colors.scrim,
            opacity: progress,
          }}
        >
          <Pressable
            accessible={false}
            onPress={visible ? onClose : undefined}
            style={{ flex: 1 }}
          />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          pointerEvents={visible ? 'auto' : 'none'}
          style={{
            transform: [{ translateY }],
            height,
            backgroundColor: colors.surface,
            borderTopLeftRadius: RADIUS.sheet,
            borderTopRightRadius: RADIUS.sheet,
            paddingTop: 20,
            paddingHorizontal: 20,
            paddingBottom: 28 + insets.bottom,
            gap: 10,
            alignItems: centered ? 'center' : undefined,
          }}
        >
          {title ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 4,
                paddingBottom: 4,
              }}
            >
              <Text
                variant={TextVariant.DialogTitle}
                accessibilityRole="header"
                style={{ flex: 1 }}
              >
                {title}
              </Text>
              {titleAccessory}
            </View>
          ) : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
