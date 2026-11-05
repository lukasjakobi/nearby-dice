import { useTranslation } from 'react-i18next';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { ScrollViewInstance } from 'react-native';

import { Chip, IconName } from '@/ui';

/** Hidden content smaller than this does not count as "more below". */
const EDGE = 8;

type Extent = { viewport: number; content: number; offset: number };

/**
 * Scroll view around the scorecard. When the rows exceed the viewport,
 * a "Weitere Felder" chip below the viewport marks the fields
 * hidden below so nobody misses them.
 */
export function ScorecardScroll({ children }: { children: (height: number) => ReactNode }) {
  const { t } = useTranslation();
  const scroll = useRef<ScrollViewInstance>(null);
  const extent = useRef<Extent>({ viewport: 0, content: 0, offset: 0 });
  const [hiddenBelow, setHiddenBelow] = useState(false);
  const [viewport, setViewport] = useState(0);

  const update = (patch: Partial<Extent>) => {
    const next = Object.assign(extent.current, patch);
    setHiddenBelow(next.viewport > 0 && next.content - next.viewport - next.offset > EDGE);
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scroll}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        onLayout={(e) => {
          const height = e.nativeEvent.layout.height;
          setViewport(height);
          update({ viewport: height });
        }}
        onContentSizeChange={(_, height) => update({ content: height })}
        onScroll={(e) => update({ offset: e.nativeEvent.contentOffset.y })}
        scrollEventThrottle={32}
      >
        {children(Math.max(0, viewport - 24))}
      </ScrollView>
      {hiddenBelow ? (
        <View style={styles.hint}>
          <Chip
            label={t('game.moreFields')}
            onPress={() => scroll.current?.scrollToEnd({ animated: true })}
            trailing={IconName.ChevronDown}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 0 },
  scroll: { flex: 1, minHeight: 0 },
  content: { flexGrow: 1, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12 },
  hint: {
    flexShrink: 0,
    alignItems: 'center',
    paddingBottom: 4,
  },
});
