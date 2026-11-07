import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { HistoryItem } from '@/shared';
import type { HistoryRow } from '@/shared';
import { BottomSheet, Text, TextVariant } from '@/ui';

type HistorySheetProps = { visible: boolean; rows: HistoryRow[]; onClose: () => void };

/** "Verlauf": every score of the game so far, newest first. */
export function HistorySheet({ visible, rows, onClose }: HistorySheetProps) {
  const { t } = useTranslation();

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('game.history')}>
      <ScrollView style={styles.scroll}>
        {rows.length === 0 ? (
          <Text variant={TextVariant.Body} color="muted" align="center" style={styles.empty}>
            {t('game.historyEmpty')}
          </Text>
        ) : (
          rows.map((row) => <HistoryItem key={row.seq} row={row} />)
        )}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, flexShrink: 1 },
  empty: { paddingVertical: 24 },
});
