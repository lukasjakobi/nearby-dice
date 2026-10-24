import { StyleSheet, View } from 'react-native';

import { Text, TextVariant, useTheme } from '@/ui';

/** One share of a ranking card's points: upper block, bonus or lower block. */
export function RankingPart({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.part, { backgroundColor: colors.surface2 }]}
    >
      <Text variant={TextVariant.Body} size={13} color="muted">
        {label}
      </Text>
      <Text variant={TextVariant.Body} size={13} weight={600}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  part: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
});
