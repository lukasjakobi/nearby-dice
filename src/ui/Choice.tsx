import { Pressable, View } from 'react-native';

import { Text, TextVariant } from './Text';
import { useTheme } from './theme/ThemeProvider';
import { RADIUS, SIZE } from './theme/tokens';

export type ChoiceOption<T> = { value: T; label: string };

export enum ChoiceStyle {
  /** Equal-width buttons in a grid (rules, theme). */
  Segments = 'segments',
  /** Segments on a surface2 track (settings "Darstellung"). */
  Track = 'track',
}

type ChoiceProps<T> = {
  label: string;
  options: ChoiceOption<T>[];
  /** `null` = nothing selected (custom rules). */
  value: T | null;
  onChange: (value: T) => void;
  style?: ChoiceStyle;
};

/** A single-choice radio group in one of the design's two looks. */
export function Choice<T extends string | number>({
  label,
  options,
  value,
  onChange,
  style = ChoiceStyle.Segments,
}: ChoiceProps<T>) {
  const { colors } = useTheme();
  const track = style === ChoiceStyle.Track;

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        gap: 8,
        ...(track ? { backgroundColor: colors.surface2, borderRadius: 16, padding: 4 } : null),
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const background = selected ? colors.primary : track ? 'transparent' : colors.surface2;

        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            style={{
              flex: 1,
              minHeight: SIZE.touch,
              paddingHorizontal: 6,
              borderRadius: RADIUS.chip,
              backgroundColor: background,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              variant={TextVariant.Label}
              size={14}
              color={selected ? 'onPrimary' : 'ink'}
              align="center"
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
