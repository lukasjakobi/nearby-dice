import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { HistoryItem } from '@/shared';
import { Choice, BottomSheet, Text, TextVariant } from '@/ui';

import type { ScoreboardView } from '../view';
import { ScoreTable } from './ScoreTable';

enum BoardTab {
  Table = 'table',
  History = 'history',
}

type ScoreboardSheetProps = { visible: boolean; board: ScoreboardView | null; onClose: () => void };

/** "Spielstand": every field of every player, plus the full history ("Verlauf"). */
export function ScoreboardSheet({ visible, board, onClose }: ScoreboardSheetProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState(BoardTab.Table);
  const tabs = [
    { value: BoardTab.Table, label: t('game.scoreboard') },
    { value: BoardTab.History, label: t('game.history') },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} height="86%" title={t('game.scoreboard')}>
      <Choice label={t('game.scoreboard')} options={tabs} value={tab} onChange={setTab} />
      {board && tab === BoardTab.Table ? (
        <>
          {board.sheetFactors ? (
            <Text
              variant={TextVariant.Caption}
              color="muted"
              align="right"
              numberOfLines={1}
              style={styles.factors}
            >
              {board.sheetFactors}
            </Text>
          ) : null}
          <ScoreTable board={board} />
        </>
      ) : null}
      {board && tab === BoardTab.History ? (
        <ScrollView style={styles.scroll}>
          {board.history.length === 0 ? (
            <Text variant={TextVariant.Body} color="muted" align="center" style={styles.empty}>
              {t('game.historyEmpty')}
            </Text>
          ) : (
            board.history.map((row) => <HistoryItem key={row.seq} row={row} />)
          )}
        </ScrollView>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  factors: { paddingHorizontal: 4, paddingTop: 2 },
  empty: { paddingVertical: 24 },
});
