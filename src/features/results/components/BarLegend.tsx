import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Text, useTheme } from '@/ui';

import type { BarPart } from '../view';
import { BAR_COLORS } from './barColors';

/** "■ Oben ■ Bonus ■ Unten" above the standings bars. */
export function BarLegend({ parts }: { parts: BarPart[] }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View
      style={styles.legend}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {parts.map((part) => (
        <View key={part} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: BAR_COLORS[part](colors).fill }]} />
          <Text size={12} color="muted">
            {t(`results.${part}`)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 3 },
});
