import { View } from 'react-native';

import { useTheme } from './theme/ThemeProvider';

type PageDotsProps = {
  count: number;
  /** 0-based; this dot stretches into a bar. */
  current: number;
  /** Spoken instead of the dots, e.g. "Schritt 2 von 3". */
  label: string;
};

/** Where a short sequence of pages stands: one dot per page. */
export function PageDots({ count, current, label }: PageDotsProps) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', gap: 8 }} accessible accessibilityLabel={label}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 28 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === current ? colors.primary : colors.line,
          }}
        />
      ))}
    </View>
  );
}
