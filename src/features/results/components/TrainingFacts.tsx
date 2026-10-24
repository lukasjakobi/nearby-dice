import { View } from 'react-native';

import { Font, fontFamily, Text, TextVariant, useTheme } from '@/ui';

import type { FactRow } from '../hooks';
import { rankingStyles } from './rankingStyles';

/** Training's few numbers (best score, Yatzys) in the same rows as the ranking. */
export function TrainingFacts({ facts }: { facts: FactRow[] }) {
  const { colors } = useTheme();

  return (
    <View style={rankingStyles.ranking}>
      {facts.map((fact) => (
        <View
          key={fact.label}
          accessible
          accessibilityLabel={`${fact.label}: ${fact.value}`}
          style={[
            rankingStyles.rankRow,
            { backgroundColor: colors.surface, borderColor: colors.line },
          ]}
        >
          <Text variant={TextVariant.BodyStrong} size={17} style={rankingStyles.flex}>
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
