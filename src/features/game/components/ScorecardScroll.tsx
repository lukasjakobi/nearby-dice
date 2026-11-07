import { useState } from 'react';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

/** Scroll view around the scorecard; hands its children the height they may fill. */
export function ScorecardScroll({ children }: { children: (height: number) => ReactNode }) {
  const [viewport, setViewport] = useState(0);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      onLayout={(e) => setViewport(e.nativeEvent.layout.height)}
    >
      {children(Math.max(0, viewport - 24))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, minHeight: 0 },
  content: { flexGrow: 1, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12 },
});
