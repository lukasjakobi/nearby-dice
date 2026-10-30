import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, Font, fontFamily, Text } from '@/ui';

type ResultsCardProps = {
  title: string;
  /** Next to the title, e.g. the bar legend. */
  trailing?: ReactNode;
  radius?: number;
  children: ReactNode;
};

/** A titled card whose rows run edge to edge below a hairline. */
export function ResultsCard({ title, trailing, radius = 20, children }: ResultsCardProps) {
  return (
    <Card padding={0} radius={radius} style={styles.card}>
      <View style={styles.head}>
        <Text
          size={18}
          accessibilityRole="header"
          style={[styles.title, { fontFamily: fontFamily(Font.Display, 600) }]}
        >
          {title}
        </Text>
        {trailing}
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  title: { flexShrink: 1 },
});
