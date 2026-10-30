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

  return (
    <View style={[styles.card, { opacity: dimmed ? 0.5 : 1 }]}>
      {sheet.tabs ? <SheetTabs sheet={sheet} onSelect={onSelectSheet} /> : null}
      <View style={styles.sections}>
        <View style={styles.section}>
          <Text size={13} weight={600} color="muted" style={styles.blockTitle}>
            {t('game.upperBlock').toUpperCase()}
          </Text>
          <View style={styles.fields}>
            {sheet.upper.map((cell) => (
              <View key={cell.category} style={styles.field}>
                <ScoreCell
                  cell={cell}
                  onPick={onPick}
                  upper
                  selected={cell.category === sheet.focused}
                />
              </View>
            ))}
          </View>
          {sheet.bonus ? <BonusProgress bonus={sheet.bonus} /> : null}
        </View>
        <View style={styles.section}>
          <Text size={13} weight={600} color="muted" style={styles.blockTitle}>
            {t('game.lowerBlock').toUpperCase()}
          </Text>
          <View style={styles.fields}>
            {sheet.lower.map((cell) => (
              <View key={cell.category} style={styles.field}>
                <ScoreCell
                  cell={cell}
                  onPick={onPick}
                  upper={false}
                  selected={cell.category === sheet.focused}
                />
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, gap: 6 },
  sections: { gap: 12 },
  section: { gap: 6 },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  field: { flexBasis: '48%', flexGrow: 1, height: 46 },
  blockTitle: { paddingHorizontal: 4, paddingVertical: 2, letterSpacing: 0.5 },
});
