import { Pressable, ScrollView } from 'react-native';

import { RADIUS, SIZE, Text, TextVariant, useTheme } from '@/ui';

import type { ModeChip } from '../hooks';

/** Horizontally scrollable mode switcher for the homepage stats; one pill per game mode. */
export function StatsModeChips({ chips }: { chips: ModeChip[] }) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
    >
      {chips.map((chip) => (
        <Pressable
          key={chip.label}
          onPress={chip.onPress}
          accessibilityRole="radio"
          accessibilityState={{ checked: chip.selected }}
          style={{
            minHeight: SIZE.touch,
            paddingHorizontal: 16,
            borderRadius: RADIUS.pill,
            borderWidth: 1.5,
            borderColor: chip.selected ? colors.primary : colors.line,
            backgroundColor: chip.selected ? colors.primary : colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant={TextVariant.Label} size={15} color={chip.selected ? 'onPrimary' : 'ink'}>
            {chip.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
