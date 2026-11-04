import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { PLAYER_COLORS } from '@/domain';
import type { PlayerColor } from '@/domain';
import { FIXED, Icon, IconName, PLAYER_COLOR_HEX, Text, TextVariant, useTheme } from '@/ui';

type ColorPickerProps = {
  label: string;
  value: PlayerColor;
  onChange: (color: PlayerColor) => void;
};

/** The six profile swatches as a radio group. */
export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={{ gap: 12 }}>
      <Text variant={TextVariant.Label}>{label}</Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={{ flexDirection: 'row', gap: 10 }}
      >
        {PLAYER_COLORS.map((color) => {
          const selected = color === value;

          return (
            <Pressable
              key={color}
              onPress={() => onChange(color)}
              accessibilityRole="radio"
              accessibilityLabel={t(`labels.playerColor.${color}`)}
              accessibilityState={{ checked: selected }}
              style={{
                flex: 1,
                aspectRatio: 1,
                minHeight: 44,
                borderRadius: 999,
                backgroundColor: PLAYER_COLOR_HEX[color],
                // The chosen swatch grows, with a gap and a ring around it.
                borderWidth: 3,
                borderColor: selected ? colors.bg : 'transparent',
                outlineWidth: selected ? 2.5 : 0,
                outlineColor: colors.ink,
                transform: [{ scale: selected ? 1.08 : 1 }],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selected ? (
                <Icon name={IconName.Check} color={FIXED.onPlayer} size={20} strokeWidth={3} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
