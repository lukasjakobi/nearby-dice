import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

/** Overlays sit above the scorecard and the action bar. */
export const OVERLAY_Z_INDEX = 40;

type ScreenOverlayProps = { children: ReactNode; background: string };

/** Covers the whole game screen with a solid background. */
export function ScreenOverlay({ children, background }: ScreenOverlayProps) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: background }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { zIndex: OVERLAY_Z_INDEX },
});
