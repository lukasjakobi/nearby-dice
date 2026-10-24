import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { PRESET_ORDER } from '@/domain';
import type { PresetId } from '@/domain';
import { Icon, Text, TextVariant, alpha, mix, useTheme } from '@/ui';

import { PRESET_ICON } from './presetIcons';

/** Pairs for the two-column grid; an odd last tile keeps half the width. */
const pairs = (ids: readonly PresetId[]) =>
  Array.from({ length: Math.ceil(ids.length / 2) }, (_, i) => ids.slice(i * 2, i * 2 + 2));

type PresetGridProps = {
  value: PresetId;
  onChange: (id: PresetId) => void;
  /** Which presets to offer, in display order. */
  presets?: readonly PresetId[];
};

/** "Spielstil": the presets as a two-column grid of icon tiles. */
export function PresetGrid({ value, onChange, presets = PRESET_ORDER }: PresetGridProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t('hostSetup.styleLabel')}
      style={{ gap: 10 }}
    >
      {pairs(presets).map((row) => (
        <View key={row.join()} style={{ flexDirection: 'row', gap: 10 }}>
          {row.map((id) => {
            const selected = id === value;

            return (
              <Pressable
                key={id}
                onPress={() => onChange(id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                style={{
                  flex: 1,
                  minHeight: 64,
                  paddingHorizontal: 12,
                  borderRadius: 18,
                  borderWidth: 2,
                  borderColor: selected ? colors.primary : colors.line,
                  backgroundColor: selected
                    ? mix(colors.primary, colors.surface, 0.1)
                    : colors.surface,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: selected ? colors.primary : alpha(colors.ink, 0.08),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    name={PRESET_ICON[id]}
                    color={selected ? colors.onPrimary : colors.ink}
                    size={22}
                    strokeWidth={2}
                  />
                </View>
                <Text variant={TextVariant.Label} size={15} style={{ flex: 1 }}>
                  {t(`labels.preset.${id}.title`)}
                </Text>
              </Pressable>
            );
          })}
          {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
}
