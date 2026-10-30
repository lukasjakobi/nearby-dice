import { useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

/** Use the bar's own width, including when it is rendered in a narrow story frame. */
export function usePlayerPillLayout(playerCount: number) {
  const [width, setWidth] = useState(0);
  const compact = width
    ? (width - 32 - (playerCount - 1) * 8) / playerCount < 104
    : playerCount > 3;

  return {
    compact,
    onLayout: (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width),
  };
}
