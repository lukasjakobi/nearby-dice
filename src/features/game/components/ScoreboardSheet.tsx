import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { HistoryItem } from '@/shared';
import { Choice, ChoiceStyle, BottomSheet, Tag, Text, TextVariant } from '@/ui';

import type { ScoreboardView } from '../view';
import { Scorecard } from './Scorecard';
import { Standings } from './Standings';

enum BoardTab {
  Table = 'table',
  History = 'history',
}

type ScoreboardSheetProps = { visible: boolean; board: ScoreboardView | null; onClose: () => void };

const ignorePick = () => {};

/**
 * "Spielstand": the standings, and below them the picked player's scorecard exactly as the
 * game screen shows it, only with their entries. "Verlauf" lists every score.
 */
export function ScoreboardSheet({ visible, board, onClose }: ScoreboardSheetProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState(BoardTab.Table);
  // Opens on my own sheet; a picked player and sheet stay while the sheet is open.
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const tabs = [
    { value: BoardTab.Table, label: t('game.scoreboard') },
    { value: BoardTab.History, label: t('game.history') },
  ];
  const player =
    board?.players.find((p) => p.id === pickedId) ??
    board?.players.find((p) => p.me) ??
    board?.players[0] ??
    null;
  const shownSheet = player ? Math.min(sheetIndex, player.sheets.length - 1) : 0;
  const yatzyBonus = player?.yatzyBonus[shownSheet] ?? null;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Choice
        label={t('game.scoreboard')}
        options={tabs}
        value={tab}
        onChange={setTab}
        style={ChoiceStyle.Track}
      />
      {board && player && tab === BoardTab.Table ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.table}>
          <Standings
            label={t('game.players')}
            players={board.players}
            selected={player.id}
            onSelect={setPickedId}
          />
          <View style={styles.card}>
            <Scorecard
              sheet={player.sheets[shownSheet]}
              dimmed={false}
              onPick={ignorePick}
              onSelectSheet={setSheetIndex}
            />
          </View>
          {yatzyBonus ? <Tag label={yatzyBonus} background="surface2" color="ink" /> : null}
        </ScrollView>
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
  table: { flexGrow: 1, gap: 16, paddingTop: 4, paddingBottom: 8 },
  card: { flexGrow: 1 },
  empty: { paddingVertical: 24 },
});
