import { useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { FIXED, Icon, IconName, Spinner, Text, TextVariant, alpha, shade, useTheme } from '@/ui';

import { ROLL_TILE_HEIGHT, ROLL_TILE_RADIUS } from './rollTile';

/** What the slide does, and so its colour: mint to roll, coral to enter a score. */
export enum SlideTone {
  Roll = 'roll',
  Confirm = 'confirm',
}

const INSET = 4;
const KNOB_WIDTH = 44;
const KNOB_EDGE = 3;
/** How far the knob has to travel before letting go counts. */
const COMMIT = 0.85;
/** The chevrons after the label fade out towards the far end, the way the knob goes. */
const CHEVRONS = [1, 0.75, 0.5];
/** A release within this distance was a tap. */
const TAP_SLOP = 6;
/** How far a tap nudges the knob before it springs back. */
const NUDGE = 24;

type SlideButtonProps = {
  label: string;
  icon: IconName;
  tone: SlideTone;
  onCommit: () => void;
  /** Sent and waiting for the host: the knob shows a spinner and does not slide. */
  busy?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A flat track with a raised dark knob: the action happens only when the knob is slid to the far
 * end and let go, so a stray tap never rolls or enters a score. Screen readers use their activate
 * action instead.
 */
export function SlideButton({
  label,
  icon,
  tone,
  onCommit,
  busy = false,
  accessibilityHint,
  style,
}: SlideButtonProps) {
  const { colors, reduceMotion } = useTheme();
  const [width, setWidth] = useState(0);
  const [offset] = useState(() => new Animated.Value(0));
  const drag = useRef({ startPageX: 0, dx: 0 });

  const face = tone === SlideTone.Roll ? colors.roll : colors.accent;
  const ink = tone === SlideTone.Roll ? colors.onRoll : colors.onAccent;
  const travel = Math.max(1, width - 2 * INSET - KNOB_WIDTH);

  const springBack = () =>
    Animated.spring(offset, { toValue: 0, useNativeDriver: false, speed: 24 });

  const release = () => {
    const { dx } = drag.current;
    drag.current.dx = 0;
    // Until it is measured, the knob has no track to slide along.
    if (width > 0 && dx >= travel * COMMIT) onCommit();
    // A tap does nothing; the knob shows which way it wants to go instead.
    if (dx < TAP_SLOP && !reduceMotion) {
      const nudge = { toValue: NUDGE, duration: 140, useNativeDriver: false };
      Animated.sequence([Animated.timing(offset, nudge), springBack()]).start();
    } else {
      springBack().start();
    }
  };

  // The system took the touch (say, the notification shade): the slide was not let go, so it
  // never counts, however far the knob got.
  const cancel = () => {
    drag.current.dx = 0;
    springBack().start();
  };

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => !busy}
      onMoveShouldSetResponder={() => !busy}
      // Keep the slide when the scorecard's scroll view wants the gesture.
      onResponderTerminationRequest={() => false}
      onResponderGrant={(event) => {
        offset.stopAnimation();
        drag.current = { startPageX: event.nativeEvent.pageX, dx: 0 };
      }}
      onResponderMove={(event) => {
        const dx = event.nativeEvent.pageX - drag.current.startPageX;
        drag.current.dx = Math.min(travel, Math.max(0, dx));
        offset.setValue(drag.current.dx);
      }}
      onResponderRelease={release}
      onResponderTerminate={cancel}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ busy }}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'activate' && !busy) onCommit();
      }}
      style={[
        {
          height: ROLL_TILE_HEIGHT,
          borderRadius: ROLL_TILE_RADIUS,
          backgroundColor: face,
          overflow: 'hidden',
          // The track lies flat, sunk a little into the felt; only the knob stands up.
          boxShadow: [
            {
              offsetX: 0,
              offsetY: 2,
              blurRadius: 3,
              color: alpha(FIXED.shadow, 0.35),
              inset: true,
            },
          ],
        },
        style,
      ]}
    >
      {/* The trail behind the knob shows how far it still has to go. */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          backgroundColor: alpha(ink, 0.14),
          width: offset.interpolate({
            inputRange: [0, travel],
            outputRange: [0, travel + INSET + KNOB_WIDTH],
          }),
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          flex: 1,
          paddingLeft: INSET + KNOB_WIDTH,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          opacity: offset.interpolate({
            inputRange: [0, travel * 0.6],
            outputRange: [1, 0],
            extrapolate: 'clamp',
          }),
        }}
      >
        <Text variant={TextVariant.BodyStrong} color={{ raw: ink }}>
          {label}
        </Text>
        <View style={{ flexDirection: 'row' }}>
          {CHEVRONS.map((opacity, i) => (
            <View key={i} style={{ marginLeft: i === 0 ? 0 : -8 }}>
              <Icon
                name={IconName.ChevronRight}
                color={alpha(ink, opacity)}
                size={16}
                strokeWidth={2.6}
              />
            </View>
          ))}
        </View>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: INSET,
          top: INSET,
          bottom: INSET,
          width: KNOB_WIDTH,
          borderRadius: ROLL_TILE_RADIUS - 3,
          backgroundColor: ink,
          borderBottomWidth: KNOB_EDGE,
          borderBottomColor: shade(ink, 0.5),
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: [{ offsetX: 0, offsetY: 2, blurRadius: 4, color: alpha(FIXED.shadow, 0.35) }],
          transform: [{ translateX: offset }],
        }}
      >
        {busy ? <Spinner color={face} size={20} /> : <Icon name={icon} color={face} size={22} />}
      </Animated.View>
    </View>
  );
}
