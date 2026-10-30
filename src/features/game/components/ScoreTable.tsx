import { useMemo } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  View,
  useAnimatedValue,
  useWindowDimensions,
} from 'react-native';

import { MAX_FONT_SCALE, Text, TextVariant, useTheme } from '@/ui';

import type { ScoreboardView } from '../view';
import { COLUMN_WIDTH, LABEL_WIDTH, ScoreTableRow } from './ScoreTableRow';

/**
 * The "Spielstand" table. When the players do not fit side by side, names and rows
 * scroll sideways together while the field names stay pinned on the left.
 */
export function ScoreTable({ board }: { board: ScoreboardView }) {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  // Columns grow with the system text size, up to where the text itself stops growing.
  const columnWidth = COLUMN_WIDTH * Math.min(Math.max(fontScale, 1), MAX_FONT_SCALE);
  // The sideways scroll offset; the label column moves by it to stay in view.
  const scrollX = useAnimatedValue(0);
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: true,
      }),
    [scrollX],
  );

  return (
    <Animated.ScrollView
      testID="score-table"
      horizontal
      bounces={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      style={styles.viewport}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.table, { minWidth: LABEL_WIDTH + board.columns.length * columnWidth }]}>
        <View style={styles.head}>
          <Animated.View
            style={[
              styles.label,
              { backgroundColor: colors.surface, transform: [{ translateX: scrollX }] },
            ]}
          />
          {board.columns.map((name) => (
            <Text
              key={name}
              variant={TextVariant.Label}
              align="center"
              numberOfLines={1}
              style={{ width: columnWidth }}
            >
              {name}
            </Text>
          ))}
        </View>
        <ScrollView style={styles.viewport}>
          {board.rows.map((row) => (
            <ScoreTableRow
              key={row.key}
              row={row}
              columnWidth={columnWidth}
              labelOffset={scrollX}
            />
          ))}
        </ScrollView>
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  // Preserve intrinsic content height in a sheet with maxHeight but no fixed height.
  viewport: { flexGrow: 0, flexShrink: 1 },
  content: { flexGrow: 1 },
  table: { flexGrow: 1 },
  head: { flexDirection: 'row', alignItems: 'center', paddingTop: 4 },
  label: { flex: 1, alignSelf: 'stretch', minWidth: LABEL_WIDTH, zIndex: 1 },
});
