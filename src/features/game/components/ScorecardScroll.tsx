import { useTranslation } from 'react-i18next';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Chip, IconName, useTheme } from '@/ui';

/** Hidden content smaller than this does not count as "more below". */
const EDGE = 8;
const FADE_HEIGHT = 56;

type Extent = { viewport: number; content: number; offset: number };

/**
 * Scroll view around the scorecard. The card normally shrinks to fit; when it still
 * cannot (small phones, large text), a fade and a "Weitere Felder" chip mark the fields
 * hidden below so nobody misses them.
 */
export function ScorecardScroll({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const scroll = useRef<ScrollViewInstance>(null);
  const extent = useRef<Extent>({ viewport: 0, content: 0, offset: 0 });
  const [hiddenBelow, setHiddenBelow] = useState(false);

  const update = (patch: Partial<Extent>) => {
    const next = Object.assign(extent.current, patch);
    setHiddenBelow(next.viewport > 0 && next.content - next.viewport - next.offset > EDGE);
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.content}
        onLayout={(e) => update({ viewport: e.nativeEvent.layout.height })}
        onContentSizeChange={(_, height) => update({ content: height })}
        onScroll={(e) => update({ offset: e.nativeEvent.contentOffset.y })}
        scrollEventThrottle={32}
      >
        {children}
      </ScrollView>
      {hiddenBelow ? (
        <View style={styles.hint} pointerEvents="box-none">
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <LinearGradient id="scorecard-fade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.bg} stopOpacity={0} />
                <Stop offset="0.7" stopColor={colors.bg} stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#scorecard-fade)" />
          </Svg>
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
  wrap: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 20 },
  hint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: FADE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
});
