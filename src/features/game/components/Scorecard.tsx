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
 * Fills the height it is given: rows shrink from 46 to 38 so Yatzy's nine lower fields
 * fit without scrolling; only below that does the card overflow its scroll view.
 */
export function Scorecard({ sheet, dimmed, onPick, onSelectSheet }: ScorecardProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.card, { opacity: dimmed ? 0.5 : 1 }]}>
      {sheet.tabs ? <SheetTabs sheet={sheet} tabs={sheet.tabs} onSelect={onSelectSheet} /> : null}
      <View style={styles.columns}>
        <View style={styles.column}>
          <Text size={13} weight={600} color="muted" style={styles.blockTitle}>
            {t('game.upperBlock').toUpperCase()}
          </Text>
          {sheet.upper.map((cell) => (
            <ScoreCell
              key={cell.category}
              cell={cell}
              onPick={onPick}
              upper
              selected={cell.category === sheet.focused}
            />
          ))}
          {sheet.bonus ? <BonusProgress bonus={sheet.bonus} /> : null}
        </View>
        <View style={styles.column}>
          <Text size={13} weight={600} color="muted" style={styles.blockTitle}>
            {t('game.lowerBlock').toUpperCase()}
          </Text>
          {sheet.lower.map((cell) => (
            <ScoreCell
              key={cell.category}
              cell={cell}
              onPick={onPick}
              upper={false}
              selected={cell.category === sheet.focused}
            />
          ))}
        </View>
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
