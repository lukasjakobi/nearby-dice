import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { HistoryItem } from '@/shared';
import type { HistoryRow } from '@/shared';
import { CollapsibleCard } from '@/ui';

/** "Verlauf" of a saved game: every entry, newest first, collapsed until asked for. */
export function HistoryCard({ rows }: { rows: HistoryRow[] }) {
  const { t } = useTranslation();

  return (
    <CollapsibleCard title={t('game.history')}>
      <View style={styles.list}>
        {rows.map((row) => (
          <HistoryItem key={row.seq} row={row} />
        ))}
      </View>
    </CollapsibleCard>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 14, paddingBottom: 4 },
});
