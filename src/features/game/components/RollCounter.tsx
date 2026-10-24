import { StyleSheet, View } from 'react-native';

import { FIXED, Text, TextVariant } from '@/ui';

import type { RollsView } from '../view';

/** Rolls left for the player whose turn it is: a line of text over one bar per roll. */
export function RollCounter({ rolls }: { rolls: RollsView }) {
  return (
    <View style={styles.rolls} accessible accessibilityLabel={rolls.rollsLabel}>
      <Text variant={TextVariant.BodyStrong} size={15} color={{ raw: FIXED.onFelt }}>
        {rolls.rollsText}
      </Text>
      <View style={styles.rollBars}>
        {Array.from({ length: rolls.rollsTotal }, (_, i) => (
          <View
            key={i}
            style={[
              styles.rollBar,
              { backgroundColor: i < rolls.rollsLeft ? FIXED.onFelt : 'transparent' },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rolls: { gap: 7 },
  rollBars: { flexDirection: 'row', gap: 5 },
  rollBar: { width: 30, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: FIXED.onFelt },
});
