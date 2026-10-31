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

/** Upper block first, then the lower block; each section keeps its fields in two columns. */
export function Scorecard({ sheet, dimmed, onPick, onSelectSheet }: ScorecardProps) {
  const { t } = useTranslation();
  const blocks = [
    { title: t('game.upperBlock'), cells: sheet.upper, bonus: sheet.bonus },
    { title: t('game.lowerBlock'), cells: sheet.lower, bonus: null },
  ];

  return (
    <View style={[styles.card, { opacity: dimmed ? 0.5 : 1 }]}>
      {sheet.tabs ? <SheetTabs sheet={sheet} onSelect={onSelectSheet} /> : null}
      {blocks.map(({ title, cells, bonus }) => (
        <View key={title} style={styles.section}>
          <Text size={13} weight={600} color="muted" style={styles.blockTitle}>
            {title.toUpperCase()}
          </Text>
          <View style={styles.fields}>
            {cells.map((cell) => (
              <ScoreCell
                key={cell.category}
                cell={cell}
                onPick={onPick}
                selected={cell.category === sheet.focused}
              />
            ))}
          </View>
          {bonus ? <BonusProgress bonus={bonus} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, gap: 12 },
  section: { gap: 6 },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  blockTitle: { paddingHorizontal: 4, paddingVertical: 2, letterSpacing: 0.5 },
});
