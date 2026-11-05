import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { RADIUS, SIZE, Text, useTheme } from '@/ui';

import type { CellView, SheetView } from '../view';
import { BonusProgress } from './BonusProgress';
import { PlayingScoreRow } from './PlayingScoreRow';
import { ScoreCell } from './ScoreCell';
import { SheetTabs } from './SheetTabs';

const MAX_PLAYING_ROW_HEIGHT = 64;

type ScorecardProps = {
  sheet: SheetView;
  dimmed: boolean;
  playing?: boolean;
  availableHeight?: number;
  onPick: (cell: CellView) => void;
  onSelectSheet: (index: number) => void;
};

/**
 * The playing board fills available height; standings keep their tile layout.
 */
export function Scorecard({
  sheet,
  dimmed,
  playing = false,
  availableHeight = 0,
  onPick,
  onSelectSheet,
}: ScorecardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const rows = Math.max(sheet.upper.length + (sheet.bonus ? 1 : 0), sheet.lower.length);
  const rowHeight = Math.min(
    MAX_PLAYING_ROW_HEIGHT,
    Math.max(SIZE.touch, Math.floor((availableHeight - SIZE.touch - (sheet.tabs ? 44 : 0)) / rows)),
  );
  const blocks = [
    { title: t('game.upperBlock'), cells: sheet.upper, bonus: sheet.bonus },
    { title: t('game.lowerBlock'), cells: sheet.lower, bonus: null },
  ];

  return (
    <View style={[styles.card, playing && styles.playingCard, { opacity: dimmed ? 0.5 : 1 }]}>
      {sheet.tabs ? <SheetTabs sheet={sheet} onSelect={onSelectSheet} /> : null}
      <View
        style={[
          styles.columns,
          playing && [styles.playingColumns, { minHeight: SIZE.touch * (rows + 1) }],
        ]}
      >
        {blocks.map(({ title, cells, bonus }) => (
          <View
            key={title}
            style={[
              styles.column,
              playing && [styles.playingColumn, { backgroundColor: colors.surface }],
            ]}
          >
            {playing ? (
              <Text size={14} weight={700} accessibilityRole="header" style={styles.playingTitle}>
                {title}
              </Text>
            ) : (
              <Text size={13} weight={600} color="muted" style={styles.blockTitle}>
                {title.toUpperCase()}
              </Text>
            )}
            {cells.map((cell) =>
              playing ? (
                <PlayingScoreRow
                  key={cell.category}
                  cell={cell}
                  onPick={onPick}
                  selected={cell.category === sheet.focused}
                  rowHeight={rowHeight}
                />
              ) : (
                <ScoreCell
                  key={cell.category}
                  cell={cell}
                  onPick={onPick}
                  selected={cell.category === sheet.focused}
                />
              ),
            )}
            {bonus ? <BonusProgress bonus={bonus} inline={playing} rowHeight={rowHeight} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, gap: 6 },
  columns: { flex: 1, flexDirection: 'row', gap: 8 },
  column: { flex: 1, gap: 6 },
  blockTitle: { paddingHorizontal: 4, paddingVertical: 2, letterSpacing: 0.5 },
  playingCard: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 'auto',
    gap: 8,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  playingColumns: { alignItems: 'flex-start' },
  playingColumn: { gap: 0, minWidth: 0, borderRadius: RADIUS.chip, overflow: 'hidden' },
  playingTitle: { minHeight: SIZE.touch, paddingHorizontal: 12, paddingVertical: 12 },
});
