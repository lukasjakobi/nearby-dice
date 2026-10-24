import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Avatar, DieFace, Font, Text, TextVariant, fontFamily, useTheme } from '@/ui';

import type { HistoryRow } from '../view/historyRows';

/** One entry of "Verlauf": who, what, when, and the dice behind it. */
export function HistoryItem({ row }: { row: HistoryRow }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={[styles.historyRow, { borderTopColor: colors.line }]}>
      <Avatar initial={row.avatar.initial} color={row.avatar.color} size={32} />
      <View style={styles.historyText}>
        <Text variant={TextVariant.Label}>{`${row.name} · ${row.title}`}</Text>
        <Text variant={TextVariant.Caption} color="muted">
          {[t('game.historyRound', { n: row.round }), row.detail].filter(Boolean).join(' · ')}
        </Text>
        {row.dice ? (
          <View style={styles.historyDice} accessible={false}>
            {row.dice.map((value, i) => (
              <DieFace key={i} value={value} size={18} lift={false} />
            ))}
          </View>
        ) : null}
      </View>
      {row.points !== null ? (
        <Text size={20} style={{ fontFamily: fontFamily(Font.Display, 600) }}>
          {String(row.points)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  historyText: { flex: 1, gap: 2 },
  historyDice: { flexDirection: 'row', gap: 3, paddingTop: 4 },
});
