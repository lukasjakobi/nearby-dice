import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/ui';

import type { CellView, SheetView } from '../view';
import { BonusProgress } from './BonusProgress';
import { ScoreCell } from './ScoreCell';
import { SheetTabs } from './SheetTabs';

type ScorecardProps = {
  sheet: SheetView;
  dimmed: boolean;
  onPick: (cell: CellView) => void;
  onSelectSheet: (index: number) => void;
};

/**
 * Two columns: "Oberer Block" with the bonus progress, "Unterer Block" with illustrations.
 * Fills the height it is given: rows shrink from 62 to 38 so Yatzy's nine lower fields
 * fit without scrolling; only below that does the card overflow its scroll view.
 */
export function Scorecard({ sheet, dimmed, onPick, onSelectSheet }: ScorecardProps) {
  const { t } = useTranslation();
  const blocks = [
    { title: t('game.upperBlock'), cells: sheet.upper, bonus: sheet.bonus },
    { title: t('game.lowerBlock'), cells: sheet.lower, bonus: null },
  ];

  return (
    <View style={[styles.card, { opacity: dimmed ? 0.5 : 1 }]}>
      {sheet.tabs ? <SheetTabs sheet={sheet} onSelect={onSelectSheet} /> : null}
      <View style={styles.columns}>
        {blocks.map(({ title, cells, bonus }) => (
          <View key={title} style={styles.column}>
            <Text size={13} weight={600} color="muted" style={styles.blockTitle}>
              {title.toUpperCase()}
            </Text>
            {cells.map((cell) => (
              <ScoreCell
                key={cell.category}
                cell={cell}
                onPick={onPick}
                selected={cell.category === sheet.focused}
              />
            ))}
            {bonus ? <BonusProgress bonus={bonus} /> : null}
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
});
