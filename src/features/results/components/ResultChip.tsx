import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/ui';
import type { FontWeight, IconName } from '@/ui';

type ResultChipProps = {
  label: string;
  background: string;
  color: string;
  weight: FontWeight;
  icon?: IconName;
};

/** A small pill under a player's name: "Yatzy" or "Kein Bonus · 52/63". */
export function ResultChip({ label, background, color, weight, icon }: ResultChipProps) {
  return (
    <View style={[styles.chip, icon && styles.withIcon, { backgroundColor: background }]}>
      {icon ? <Icon name={icon} color={color} size={12} strokeWidth={1.6} /> : null}
      <Text size={12} weight={weight} color={{ raw: color }} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 20,
    paddingHorizontal: 7,
    borderRadius: 10,
  },
  withIcon: { paddingLeft: 5 },
  label: { lineHeight: 16 },
});
