import { Pressable, StyleSheet, View } from 'react-native';

import { FIXED, Font, Text, alpha, fontFamily, mix, useTheme } from '@/ui';
import type { ColorToken, Palette } from '@/ui';

import { CellState } from '../view';
import type { CellView } from '../view';
import { CategoryIcon } from './CategoryIcon';

/** Rows grow to this so the two blocks fill the sheet down to the dice; the bonus row matches. */
export const CELL_MAX_HEIGHT = 70;

type CellLook = {
  background: string;
  border: string;
  iconOpacity: number;
  label: ColorToken;
  labelWeight: 400 | 600;
  valueBackground: string;
  value: ColorToken;
  valueWeight: 400 | 600;
};

/**
 * One look per state. What can be scored this roll is a solid pill; a zero stays neutral, since
 * striking a field is a choice, not a mistake; entered points sit quietly on a filled cell.
 */
const LOOKS: Record<Exclude<CellState, CellState.Blocked>, (c: Palette) => CellLook> = {
  [CellState.Filled]: (c) => ({
    background: c.surface2,
    border: c.surface2,
    iconOpacity: 0.45,
    label: 'muted',
    labelWeight: 400,
    valueBackground: 'transparent',
    value: 'ink',
    valueWeight: 600,
  }),
  [CellState.Preview]: (c) => ({
    background: c.surface,
    border: mix(c.primary, c.line, 0.45),
    iconOpacity: 1,
    label: 'ink',
    labelWeight: 600,
    valueBackground: c.primary,
    value: 'onPrimary',
    valueWeight: 600,
  }),
  [CellState.PreviewZero]: (c) => ({
    background: c.surface,
    border: c.line,
    iconOpacity: 0.8,
    label: 'ink',
    labelWeight: 400,
    valueBackground: c.surface2,
    value: 'muted',
    valueWeight: 600,
  }),
  [CellState.Open]: (c) => ({
    background: c.surface,
    border: c.line,
    iconOpacity: 0.7,
    label: 'ink',
    labelWeight: 400,
    valueBackground: 'transparent',
    value: 'muted',
    valueWeight: 400,
  }),
};

type ScoreCellProps = {
  cell: CellView;
  onPick: (cell: CellView) => void;
  selected: boolean;
};

/** One field of the scorecard: icon, name, hint and the (preview) points. */
export function ScoreCell({ cell, onPick, selected }: ScoreCellProps) {
  const { colors } = useTheme();
  const state = cell.state === CellState.Blocked ? CellState.Open : cell.state;
  const look = LOOKS[state](colors);
  const background = selected ? mix(colors.primary, colors.surface, 0.24) : look.background;
  const border = selected ? colors.primary : look.border;
  // Someone else's possible points: outlined, so a watcher doesn't read them as entered.
  const watched = cell.state === CellState.Preview && !cell.pickable;
  const valueBackground = selected
    ? colors.primary
    : watched
      ? alpha(colors.primary, 0.14)
      : look.valueBackground;
  const valueColor = selected ? 'onPrimary' : watched ? 'primary' : look.value;
  // "Kleine Straße" wraps at its space; a single word like "Dreierpasch" shrinks instead of
  // breaking in the middle, and so does a name with a hint below it.
  const singleLine = cell.hint !== null || !cell.label.includes(' ');

  return (
    <Pressable
      onPress={() => onPick(cell)}
      disabled={!cell.pickable}
      accessibilityRole="button"
      accessibilityLabel={cell.accessibilityLabel}
      accessibilityState={{ disabled: !cell.pickable, selected }}
      style={({ pressed }) => [
        styles.cell,
        { backgroundColor: background, borderColor: border, borderWidth: selected ? 2 : 1.5 },
        // What I can score lifts off the sheet a little; everything else lies flat.
        cell.pickable && !selected && !pressed && styles.lifted,
        pressed && styles.cellPressed,
      ]}
    >
      <View
        style={[
          styles.tile,
          { backgroundColor: alpha(colors.ink, 0.08), opacity: look.iconOpacity },
        ]}
      >
        <CategoryIcon
          category={cell.category}
          face={cell.face}
          color={colors.ink}
          size={cell.face !== null ? 26 : 20}
        />
      </View>
      <View style={styles.label}>
        <Text
          size={12.5}
          weight={look.labelWeight}
          color={look.label}
          numberOfLines={singleLine ? 1 : 2}
          adjustsFontSizeToFit={singleLine}
          minimumFontScale={0.8}
        >
          {cell.label}
        </Text>
        {cell.hint ? (
          <Text size={10.5} color={look.label} numberOfLines={1} style={styles.hint}>
            {cell.hint}
          </Text>
        ) : null}
      </View>
      <View style={[styles.value, { backgroundColor: valueBackground }]}>
        <Text
          size={15}
          color={valueColor}
          style={{ fontFamily: fontFamily(Font.Display, look.valueWeight) }}
        >
          {cell.value}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minHeight: 38,
    maxHeight: CELL_MAX_HEIGHT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  cellPressed: { transform: [{ scale: 0.97 }], opacity: 0.8 },
  lifted: {
    shadowColor: FIXED.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tile: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, minWidth: 0 },
  hint: { opacity: 0.8 },
  value: {
    minWidth: 30,
    height: 26,
    paddingHorizontal: 7,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
