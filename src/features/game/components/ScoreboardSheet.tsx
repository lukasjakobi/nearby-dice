import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { HistoryItem } from '@/shared';
import { Choice, BottomSheet, Text, TextVariant } from '@/ui';

import type { ScoreboardView } from '../view';
import { PlayerPicker } from './PlayerPicker';
import { PlayerSheet } from './PlayerSheet';

enum BoardTab {
  Table = 'table',
  History = 'history',
}

type ScoreboardSheetProps = { visible: boolean; board: ScoreboardView | null; onClose: () => void };

/** "Spielstand": one player's sheet at a time, plus the full history ("Verlauf"). */
export function ScoreboardSheet({ visible, board, onClose }: ScoreboardSheetProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState(BoardTab.Table);
  // The sheet opens on my own; picking another player keeps that choice while the sheet is open.
  const [pickedId, setPickedId] = useState<string | null>(null);
  const tabs = [
    { value: BoardTab.Table, label: t('game.scoreboard') },
    { value: BoardTab.History, label: t('game.history') },
  ];
  const player =
    board?.players.find((p) => p.id === pickedId) ??
    board?.players.find((p) => p.me) ??
    board?.players[0] ??
    null;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('game.scoreboard')}>
      <Choice label={t('game.scoreboard')} options={tabs} value={tab} onChange={setTab} />
      {board && player && tab === BoardTab.Table ? (
        <>
          <PlayerPicker
            label={t('game.players')}
            players={board.players}
            selected={player.id}
            onSelect={setPickedId}
          />
          <ScrollView style={styles.scroll} contentContainerStyle={styles.table}>
            <PlayerSheet player={player} factors={board.sheetFactors} />
          </ScrollView>
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
  scroll: { flexGrow: 0, flexShrink: 1 },
  table: { paddingBottom: 4 },
  empty: { paddingVertical: 24 },
});
