import { StyleSheet, View } from 'react-native';

import { Font, fontFamily, Text, TextVariant, useTheme } from '@/ui';

import type { FactRow } from '../hooks';

/** Training's few numbers (best score, Yatzys) in the same rows as the ranking. */
export function TrainingFacts({ facts }: { facts: FactRow[] }) {
  const { colors } = useTheme();

  return (
    <View style={styles.facts}>
      {facts.map((fact) => (
        <View
          key={fact.label}
          accessible
          accessibilityLabel={`${fact.label}: ${fact.value}`}
          style={[styles.fact, { backgroundColor: colors.surface, borderColor: colors.line }]}
        >
          <Text variant={TextVariant.BodyStrong} size={17} style={styles.flex}>
            {fact.label}
          </Text>
          <Text size={26} style={{ fontFamily: fontFamily(Font.Display, 700) }}>
            {String(fact.value)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  facts: { gap: 10 },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  flex: { flex: 1 },
});
