import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text, TextVariant } from '@/ui';

/** A titled group on the settings screen (title is a header for screen readers). */
export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Text variant={TextVariant.SectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}
