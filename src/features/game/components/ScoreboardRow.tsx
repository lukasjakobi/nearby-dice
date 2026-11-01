import { StyleSheet, View } from 'react-native';

import { Font, Text, fontFamily, useTheme } from '@/ui';

import type { BoardRow } from '../view';
import { CategoryIcon } from './CategoryIcon';

type ScoreboardRowProps = { row: BoardRow };

/** One field of a player's sheet on "Spielstand": its icon as on the scorecard, name, value. */
export function ScoreboardRow({ row }: ScoreboardRowProps) {
  const { colors } = useTheme();
  const open = row.value === '–';

  return (
    <View
      accessible
      accessibilityLabel={`${row.label}: ${row.value}`}
      style={[styles.row, { borderBottomColor: colors.line }]}
    >
      <View style={styles.icon}>
        {row.category ? (
          <CategoryIcon
            category={row.category}
            face={row.face}
            color={colors.ink}
            size={row.face !== null ? 24 : 20}
          />
        ) : null}
      </View>
      <Text size={14} color={open ? 'muted' : 'ink'} numberOfLines={1} style={styles.label}>
        {row.label}
      </Text>
      <Text
        size={16}
        align="right"
        color={open ? 'muted' : 'ink'}
        style={{ fontFamily: fontFamily(Font.Display, 600) }}
      >
        {row.value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 40,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  icon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, minWidth: 0 },
});
