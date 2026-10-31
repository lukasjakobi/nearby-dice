import { Pressable, StyleSheet, View } from 'react-native';

import { Font, Icon, IconName, Text, alpha, fontFamily, mix, useTheme } from '@/ui';
import type { ColorToken, Palette } from '@/ui';

import { CellState } from '../view';
import type { CellView } from '../view';
import { CategoryIcon } from './CategoryIcon';

type CellLook = {
  background: string;
  border: string;
  dashed: boolean;
  iconOpacity: number;
  label: ColorToken;
  labelWeight: 400 | 600;
  valueBackground: string;
  value: ColorToken;
  valueWeight: 400 | 600;
  check: boolean;
};

/** The three cell states (plus the red zero preview), one look each. */
const LOOKS: Record<CellState, (c: Palette) => CellLook> = {
  [CellState.Filled]: (c) => ({
    background: c.surface2,
    border: 'transparent',
    dashed: false,
    iconOpacity: 0.5,
    label: 'muted',
    labelWeight: 400,
    valueBackground: 'transparent',
    value: 'ink',
    valueWeight: 600,
    check: true,
  }),
  [CellState.Preview]: (c) => ({
    background: mix(c.primary, c.surface, 0.06),
    border: mix(c.primary, c.line, 0.4),
    dashed: false,
    iconOpacity: 1,
    label: 'ink',
    labelWeight: 600,
    valueBackground: mix(c.primary, c.surface, 0.14),
    value: 'primary',
    valueWeight: 600,
    check: false,
  }),
  [CellState.PreviewZero]: (c) => ({
    background: mix(c.danger, c.surface, 0.08),
    border: mix(c.danger, c.line, 0.55),
    dashed: false,
    iconOpacity: 1,
    label: 'ink',
    labelWeight: 600,
    valueBackground: mix(c.danger, c.surface, 0.16),
    value: 'danger',
    valueWeight: 600,
    check: false,
  }),
  [CellState.Open]: (c) => ({
    background: 'transparent',
    border: c.line,
    dashed: true,
    iconOpacity: 0.6,
    label: 'muted',
    labelWeight: 400,
    valueBackground: 'transparent',
    value: 'muted',
    valueWeight: 400,
    check: false,
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
  const look = LOOKS[cell.state](colors);
  const background = selected ? mix(colors.primary, colors.surface, 0.18) : look.background;
  const border = selected ? colors.primary : look.border;

  return (
    <Pressable
      onPress={() => onPick(cell)}
      disabled={!cell.pickable}
      accessibilityRole="button"
      accessibilityLabel={cell.accessibilityLabel}
      accessibilityState={{ disabled: !cell.pickable, selected }}
      style={({ pressed }) => [
        styles.cell,
        {
          backgroundColor: background,
          borderColor: border,
          borderStyle: look.dashed ? 'dashed' : 'solid',
        },
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
          numberOfLines={cell.hint ? 1 : undefined}
          adjustsFontSizeToFit={cell.hint !== null}
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
      {look.check || selected ? (
        <Icon
          name={IconName.Check}
          color={selected ? colors.primary : colors.ok}
          size={14}
          strokeWidth={3.2}
        />
      ) : null}
      <View style={[styles.value, { backgroundColor: look.valueBackground }]}>
        <Text
          size={15}
          color={look.value}
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
    flexBasis: '48%',
    flexGrow: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  cellPressed: { transform: [{ scale: 0.97 }], opacity: 0.8 },
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
    minWidth: 26,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
