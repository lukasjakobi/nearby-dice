import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Avatar, CollapsibleCard, mix, Text, TextVariant, useTheme } from '@/ui';

import type { CompareRow, RankRow } from '../view';

/** Narrower columns as players are added, so six still fit on a phone. */
const columnWidth = (columns: number) => (columns <= 3 ? 56 : columns === 4 ? 48 : 40);

type ScoreComparisonProps = {
  /** One column per player, in ranking order. */
  columns: RankRow[];
  rows: CompareRow[];
};

/** "Alle Felder im Vergleich": every field side by side, collapsed until asked for. */
export function ScoreComparison({ columns, rows }: ScoreComparisonProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const width = columnWidth(columns.length);
  const cellWidth = Math.min(40, width - 6);

  return (
    <CollapsibleCard title={t('results.compare')}>
      <View style={[styles.row, styles.head, { borderTopColor: colors.line }]}>
        <Text variant={TextVariant.Body} size={13} color="muted" style={styles.flex}>
          {t('results.field')}
        </Text>
        {columns.map((column) => (
          <View
            key={column.id}
            accessible
            accessibilityLabel={column.name}
            style={[styles.cell, { width }]}
          >
            <Avatar initial={column.avatar.initial} color={column.avatar.color} size={28} />
          </View>
        ))}
      </View>
      {rows.map((row) => (
        <View
          key={row.label}
          accessible
          accessibilityLabel={`${row.label}: ${columns
            .map((column, i) => `${column.name} ${row.cells[i].value}`)
            .join(', ')}`}
          style={[
            styles.row,
            styles.body,
            { borderTopColor: colors.line },
            row.total && { backgroundColor: colors.surface2 },
          ]}
        >
          <Text
            variant={TextVariant.Body}
            size={14}
            weight={row.total ? 700 : 400}
            numberOfLines={1}
            style={styles.flex}
          >
            {row.label}
          </Text>
          {row.cells.map((cell, i) => (
            <View key={columns[i].id} style={[styles.cell, { width }]}>
              <Text
                variant={TextVariant.Body}
                size={14}
                weight={cell.best ? 700 : 400}
                color={cell.best ? 'ink' : 'muted'}
                align="center"
                style={[
                  styles.value,
                  { minWidth: cellWidth },
                  cell.best && { backgroundColor: mix(colors.primary, colors.surface, 0.16) },
                ]}
              >
                {cell.value}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </CollapsibleCard>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 8 },
  head: { paddingVertical: 8, borderTopWidth: 1 },
  body: { minHeight: 38, borderTopWidth: 1 },
  cell: { alignItems: 'center' },
  value: { lineHeight: 28, borderRadius: 10, overflow: 'hidden', marginVertical: 4 },
});
