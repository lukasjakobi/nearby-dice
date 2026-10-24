import { useRef, useState } from 'react';
import { View } from 'react-native';

import { useTheme } from './theme/ThemeProvider';
import { SIZE } from './theme/tokens';

type SliderProps = {
  /** 0–1. */
  value: number;
  onChange: (value: number) => void;
  label: string;
  /** Snapping interval; onChange only fires when the snapped value changes. */
  step?: number;
};

const KNOB = 24;
const TRACK = 6;

const snap = (fraction: number, step: number) => {
  const clamped = Math.min(1, Math.max(0, fraction));

  return Math.round(Math.round(clamped / step) * step * 100) / 100;
};

/** The design's slider: 6 pt track filled in primary, the switch's white knob; 44 pt touch target. */
export function Slider({ value, onChange, label, step = 0.1 }: SliderProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const drag = useRef({ startX: 0, startPageX: 0, last: value });

  const emitAt = (x: number) => {
    if (width <= KNOB) return;
    const next = snap((x - KNOB / 2) / (width - KNOB), step);
    if (next === drag.current.last) return;
    drag.current.last = next;
    onChange(next);
  };

  const travel = Math.max(0, width - KNOB);
  const percent = Math.round(value * 100);
  const nudge = (direction: 1 | -1) => {
    const next = snap(value + direction * step, step);
    if (next !== value) onChange(next);
  };

  return (
    <View
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      // Keep the drag when a surrounding ScrollView or sheet wants the gesture.
      onResponderTerminationRequest={() => false}
      onResponderGrant={(event) => {
        const { locationX, pageX } = event.nativeEvent;
        drag.current = { startX: locationX, startPageX: pageX, last: value };
        emitAt(locationX);
      }}
      onResponderMove={(event) =>
        emitAt(drag.current.startX + event.nativeEvent.pageX - drag.current.startPageX)
      }
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: percent, text: `${percent} %` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) =>
        nudge(event.nativeEvent.actionName === 'increment' ? 1 : -1)
      }
      style={{ height: SIZE.touch, justifyContent: 'center' }}
    >
      <View pointerEvents="none" style={{ height: KNOB, justifyContent: 'center' }}>
        <View
          style={{
            marginHorizontal: KNOB / 2,
            height: TRACK,
            borderRadius: TRACK / 2,
            backgroundColor: colors.line,
            overflow: 'hidden',
          }}
        >
          <View style={{ width: value * travel, height: TRACK, backgroundColor: colors.primary }} />
        </View>
        <View
          style={{
            position: 'absolute',
            left: value * travel,
            width: KNOB,
            height: KNOB,
            borderRadius: KNOB / 2,
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </View>
    </View>
  );
}
