import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text, TextVariant } from './Text';

type SectionProps = {
  title: string;
  /** Right of the title, on its baseline: a count or a small note. */
  trailing?: ReactNode;
  /** Space between the title and the content, and within the content. */
  gap?: number;
  children: ReactNode;
};

/** A titled group of a screen; the title is a header for screen readers. */
export function Section({ title, trailing, gap = 10, children }: SectionProps) {
  const heading = (
    <Text variant={TextVariant.SectionTitle} accessibilityRole="header">
      {title}
    </Text>
  );

  return (
    <View style={{ gap }}>
      {trailing ? (
        <View
          style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}
        >
          {heading}
          {trailing}
        </View>
      ) : (
        heading
      )}
      {children}
    </View>
  );
}
