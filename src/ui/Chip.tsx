import { Pressable } from 'react-native';

import { Icon } from './icons/Icon';
import type { IconName } from './icons/Icon';
import { Text } from './Text';
import { useTheme } from './theme/ThemeProvider';

type ChipProps = {
  label: string;
  onPress: () => void;
  /** Icon before the label ("‹ Zurück"). */
  leading?: IconName;
  /** Icon after the label ("Weitere Felder ⌄"). */
  trailing?: IconName;
};

/** A small outlined pill for a secondary action that floats over content. */
export function Chip({ label, onPress, leading, trailing }: ChipProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        // The icon side sits closer to the edge.
        paddingLeft: leading ? 10 : 14,
        paddingRight: trailing ? 10 : 14,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        backgroundColor: colors.surface,
        borderColor: colors.line,
      }}
    >
      {leading ? <Icon name={leading} color={colors.ink} size={16} /> : null}
      <Text size={13} weight={600}>
        {label}
      </Text>
      {trailing ? <Icon name={trailing} color={colors.ink} size={16} /> : null}
    </Pressable>
  );
}
