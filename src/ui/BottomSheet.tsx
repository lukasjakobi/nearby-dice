import { useEffect, useRef, useState } from 'react';
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
import type { DimensionValue, GestureResponderEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, TextVariant } from './Text';
import { useTheme } from './theme/ThemeProvider';
import { RADIUS } from './theme/tokens';

type BottomSheetProps = {
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
/** A downward drag released past this share of the sheet's height closes it. */
const CLOSE_FRACTION = 0.5;
/** A release moving down faster than this (pt/ms) closes the sheet however far it was dragged. */
const FLICK_VELOCITY = 0.8;
/** Movement before the sheet takes the touch from a button inside it. */
const DRAG_SLOP = 6;
/** A finger resting this long before it lifts released the sheet without a flick. */
const FLICK_PAUSE_MS = 80;
/** Dragged up past its rest position, the sheet follows only this share of the finger. */
const OVERDRAG = 0.2;
/** Surface below the sheet's bottom edge, so an upward overdrag shows no gap. */
const UNDERLAY = 80;
const SPRING = { stiffness: 380, damping: 36, mass: 1, useNativeDriver: true } as const;

/** Whether a drag released `dy` down at `vy` pt/ms closes a sheet `height` tall. */
export function closesOnRelease(dy: number, vy: number, height: number): boolean {
  return dy > height * CLOSE_FRACTION || (vy > FLICK_VELOCITY && dy > DRAG_SLOP);
}

/**
 * The app's one bottom sheet: a handle on top, over a scrim. It springs up from the bottom edge
 * while the scrim fades in. Dragging it down follows the finger and fades the scrim; released past
 * half its height or flicked down, it closes, otherwise it springs back. Tapping the scrim, Back
 * or the screen reader's escape gesture close it too.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  titleAccessory,
  children,
  height,
  centered,
}: BottomSheetProps) {
  const { colors, reduceMotion } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const progress = useAnimatedValue(0);
  const drag = useAnimatedValue(0);
  const [sheetHeight, setSheetHeight] = useState(windowHeight);
  // Stays mounted while the close animation runs.
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);
  if (!visible && mounted && reduceMotion) setMounted(false);

  const gesture = useRef({ startX: 0, startY: 0, lastY: 0, lastT: 0, vy: 0 });
  const settle = () => {
    if (reduceMotion) drag.setValue(0);
    else Animated.spring(drag, { ...SPRING, toValue: 0 }).start();
  };

  const dragHandlers = {
    // Notes where every touch (or mouse press, on web) begins without taking it from the buttons.
    onStartShouldSetResponderCapture: (event: GestureResponderEvent) => {
      gesture.current.startX = event.nativeEvent.pageX;
      gesture.current.startY = event.nativeEvent.pageY;

      return false;
    },
    // Taps stay with the buttons; a vertical drag anywhere on the sheet moves it. Scroll views and
    // sliders inside are asked first and keep their own gestures.
    onMoveShouldSetResponder: (event: GestureResponderEvent) => {
      const dx = event.nativeEvent.pageX - gesture.current.startX;
      const dy = event.nativeEvent.pageY - gesture.current.startY;

      return visible && Math.abs(dy) > DRAG_SLOP && Math.abs(dy) > Math.abs(dx);
    },
    // Once the sheet moves, the drag stays with it, even when the finger passes over a slider.
    onResponderTerminationRequest: () => false,
    onResponderGrant: (event: GestureResponderEvent) => {
      drag.stopAnimation();
      Object.assign(gesture.current, {
        lastY: event.nativeEvent.pageY,
        lastT: event.nativeEvent.timestamp,
        vy: 0,
      });
    },
    onResponderMove: (event: GestureResponderEvent) => {
      const { pageY, timestamp } = event.nativeEvent;
      const g = gesture.current;
      // Smoothed, so one uneven touch sample neither makes nor spoils a flick.
      if (timestamp > g.lastT)
        g.vy = 0.3 * g.vy + (0.7 * (pageY - g.lastY)) / (timestamp - g.lastT);
      g.lastY = pageY;
      g.lastT = timestamp;
      const dy = pageY - g.startY;
      drag.setValue(dy > 0 ? dy : dy * OVERDRAG);
    },
    onResponderRelease: (event: GestureResponderEvent) => {
      const g = gesture.current;
      // A finger that stopped before lifting is not a flick.
      const vy = event.nativeEvent.timestamp - g.lastT > FLICK_PAUSE_MS ? 0 : g.vy;
      if (closesOnRelease(g.lastY - g.startY, vy, sheetHeight)) onClose();
      else settle();
    },
    onResponderTerminate: settle,
  };

  useEffect(() => {
    if (visible) {
      drag.setValue(0);
      if (reduceMotion) {
        progress.setValue(1);

        return;
      }

      const open = Animated.spring(progress, { ...SPRING, toValue: 1 });
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
  }, [visible, reduceMotion, progress, drag]);

  const translateY = Animated.add(
    progress.interpolate({ inputRange: [0, 1], outputRange: [windowHeight, 0] }),
    drag,
  );
  const scrimOpacity = Animated.multiply(
    progress,
    drag.interpolate({
      inputRange: [0, Math.max(1, sheetHeight)],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    }),
  );

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
            opacity: scrimOpacity,
          }}
        >
          <Pressable
            accessible={false}
            onPress={visible ? onClose : undefined}
            style={{ flex: 1 }}
          />
        </Animated.View>
        <Animated.View
          {...dragHandlers}
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
          pointerEvents={visible ? 'auto' : 'none'}
          style={{
            transform: [{ translateY }],
            // On web a text selection would end the drag; text in the sheet is not selectable on phones either.
            userSelect: 'none',
            height,
            backgroundColor: colors.surface,
            borderTopLeftRadius: RADIUS.sheet,
            borderTopRightRadius: RADIUS.sheet,
            paddingHorizontal: 20,
            paddingBottom: 28 + insets.bottom,
            gap: 10,
            alignItems: centered ? 'center' : undefined,
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              height: UNDERLAY,
              backgroundColor: colors.surface,
            }}
          />
          <View
            testID="bottom-sheet-handle"
            style={{ alignSelf: 'stretch', alignItems: 'center', paddingTop: 10 }}
          >
            <View
              style={{
                width: 40,
                height: 5,
                borderRadius: RADIUS.pill,
                backgroundColor: colors.line,
              }}
            />
          </View>
          {title ? (
            <View
              style={{
                alignSelf: 'stretch',
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
