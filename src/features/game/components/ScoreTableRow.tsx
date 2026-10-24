import { Animated, StyleSheet, View } from 'react-native';

import { Font, Text, TextVariant, fontFamily, useTheme } from '@/ui';

import { BoardRowKind } from '../view';
import type { BoardRow } from '../view';

/** Width of one player's column in the scoreboard table at the default text size. */
export const COLUMN_WIDTH = 64;
/** Narrowest the field names get; with more players the table scrolls sideways instead. */
export const LABEL_WIDTH = 112;

type ScoreTableRowProps = {
  row: BoardRow;
  columnWidth: number;
  /** How far the table is scrolled sideways; the label moves along to stay in view. */
  labelOffset: Animated.Value;
};

/** One line of "Spielstand": a field, the bonus rows or the total, one cell per player. */
export function ScoreTableRow({ row, columnWidth, labelOffset }: ScoreTableRowProps) {
  const { colors } = useTheme();
  const emphasis = row.kind !== BoardRowKind.Field;
  const total = row.kind === BoardRowKind.Total;
  const background = emphasis ? colors.surface2 : colors.surface;

  return (
    <View style={[styles.tableRow, { borderTopColor: colors.line, backgroundColor: background }]}>
      <Animated.View
        style={[
          styles.rowLabel,
          { backgroundColor: background, transform: [{ translateX: labelOffset }] },
        ]}
      >
        <Text variant={TextVariant.Body} weight={total ? 600 : emphasis ? 600 : 400}>
          {row.label}
        </Text>
      </Animated.View>
      {row.cells.map((cell, i) => (
        <Text
          key={i}
          size={total ? 20 : 15}
          align="center"
          color={total ? 'primary' : cell === '–' ? 'muted' : 'ink'}
          style={{ width: columnWidth, fontFamily: fontFamily(Font.Display, total ? 700 : 500) }}
        >
          {cell}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  rowLabel: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    minWidth: LABEL_WIDTH,
    paddingVertical: 9,
    paddingLeft: 4,
    zIndex: 1,
  },
});
