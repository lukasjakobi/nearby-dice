import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { alpha, Font, fontFamily, Icon, IconName, RADIUS, SIZE, Text, useTheme } from '@/ui';
import type { ColorToken } from '@/ui';

import { CellState } from '../view';
import type { CellView } from '../view';
import { CategoryIcon } from './CategoryIcon';

const VALUE_COLOR: Record<CellState, ColorToken> = {
  [CellState.Filled]: 'ink',
  [CellState.Preview]: 'primary',
  [CellState.PreviewZero]: 'danger',
  [CellState.Open]: 'muted',
  [CellState.Blocked]: 'danger',
};

type PlayingScoreRowProps = {
  cell: CellView;
  onPick: (cell: CellView) => void;
  selected: boolean;
  rowHeight?: number;
};

/** A score target that grows with the board, without shrinking below a touch target. */
export function PlayingScoreRow({
  cell,
  onPick,
  selected,
  rowHeight = SIZE.touch,
}: PlayingScoreRowProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width <= 340;
  const labelSize = compact ? 12 : Math.min(15, 13 + Math.floor((rowHeight - SIZE.touch) / 16));
  const valueColor = VALUE_COLOR[cell.state];
  const preview = cell.state === CellState.Preview;
  const filled = cell.state === CellState.Filled;
  const solidPreview = preview && (cell.pickable || selected);
  const valueBackground = solidPreview
    ? colors.primary
    : preview || valueColor === 'danger'
      ? alpha(colors[valueColor], 0.12)
      : filled
        ? colors.surface2
        : undefined;
  const labelColor = filled ? 'muted' : 'ink';
  const singleLine = cell.hint !== null || !cell.label.includes(' ');

  return (
    <Pressable
      onPress={() => onPick(cell)}
      disabled={!cell.pickable}
      accessibilityRole="button"
      accessibilityLabel={cell.accessibilityLabel}
      accessibilityState={{ disabled: !cell.pickable, selected }}
      style={({ pressed }) => [
        styles.row,
        { minHeight: rowHeight },
        compact && styles.compactRow,
        { borderTopColor: alpha(colors.ink, 0.1) },
        (selected || pressed) && { backgroundColor: colors.surface2 },
      ]}
    >
      <View style={styles.icon}>
        <CategoryIcon
          category={cell.category}
          face={cell.face}
          color={colors[labelColor]}
          size={cell.face !== null ? 23 : 19}
        />
        {filled ? (
          <View
            style={[styles.entered, { backgroundColor: colors.surface, borderColor: colors.line }]}
          >
            <Icon name={IconName.Check} color={colors.primary} size={10} strokeWidth={3} />
          </View>
        ) : null}
      </View>
      <View style={styles.label}>
        <Text
          size={labelSize}
          weight={selected ? 700 : 500}
          color={labelColor}
          numberOfLines={singleLine ? 1 : 2}
          adjustsFontSizeToFit={singleLine}
          minimumFontScale={0.8}
        >
          {cell.label}
        </Text>
        {cell.hint ? (
          <Text size={10.5} color="muted" numberOfLines={1}>
            {cell.hint}
          </Text>
        ) : null}
      </View>
      <View style={[styles.value, { backgroundColor: valueBackground }]}>
        {cell.state === CellState.Blocked ? (
          <Icon name={IconName.Ban} color={colors.danger} size={14} />
        ) : (
          <Text size={16} color={solidPreview ? 'onPrimary' : valueColor} style={styles.points}>
            {cell.value}
          </Text>
        )}
      </View>
      {selected ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.selection, { borderColor: colors.primary }]}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: SIZE.touch,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    gap: 5,
  },
  compactRow: { paddingHorizontal: 6 },
  icon: { width: 23, alignItems: 'center' },
  entered: {
    position: 'absolute',
    bottom: -3,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: RADIUS.chip / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selection: { borderWidth: 2, borderRadius: RADIUS.chip / 2 },
  label: { flex: 1, minWidth: 0 },
  value: {
    minWidth: 26,
    minHeight: 24,
    borderRadius: RADIUS.chip / 2,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  points: { fontFamily: fontFamily(Font.Display, 500) },
});
