import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { PRESET_ORDER } from '@/domain';
import type { PresetId } from '@/domain';
import { Chip, Icon, IconName, Text, TextVariant, useTheme } from '@/ui';

import { PRESET_ICON } from './presetIcons';

const COLUMNS = 4;

/** Rows of four; a short last row keeps its tiles at the same width. */
const rows = (ids: readonly PresetId[]) =>
  Array.from({ length: Math.ceil(ids.length / COLUMNS) }, (_, i) =>
    ids.slice(i * COLUMNS, (i + 1) * COLUMNS),
  );

type PresetGridProps = {
  value: PresetId;
  onChange: (id: PresetId) => void;
  /** Which presets to offer, in display order. */
  presets?: readonly PresetId[];
  /** Opens the rules of the chosen preset, from the "Regeln" chip beside the label. */
  onRules: () => void;
};

/**
 * "Spielstil  ⓘ Regeln" over the presets as a dock of icon buttons, four per row, each named
 * underneath.
 */
export function PresetGrid({ value, onChange, presets = PRESET_ORDER, onRules }: PresetGridProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant={TextVariant.Label}>{t('hostSetup.styleLabel')}</Text>
        <Chip label={t('lobby.rulesButton')} leading={IconName.Info} onPress={onRules} />
      </View>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t('hostSetup.styleLabel')}
        style={{ gap: 14 }}
      >
        {rows(presets).map((row) => (
          <View key={row.join()} style={{ flexDirection: 'row', gap: 4 }}>
            {row.map((id) => {
              const selected = id === value;
              const title = t(`labels.preset.${id}.title`);

              return (
                <Pressable
                  key={id}
                  onPress={() => onChange(id)}
                  accessibilityRole="radio"
                  accessibilityLabel={title}
                  accessibilityState={{ checked: selected }}
                  style={{ flex: 1, alignItems: 'center', gap: 6 }}
                >
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 18,
                      borderWidth: 1.5,
                      borderColor: selected ? colors.primary : colors.line,
                      backgroundColor: selected ? colors.primary : colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon
                      name={PRESET_ICON[id]}
                      color={selected ? colors.onPrimary : colors.ink}
                      size={28}
                      strokeWidth={2}
                    />
                  </View>
                  <Text
                    variant={TextVariant.Small}
                    weight={600}
                    align="center"
                    color={selected ? 'primary' : 'muted'}
                  >
                    {title}
                  </Text>
                </Pressable>
              );
            })}
            {Array.from({ length: COLUMNS - row.length }, (_, i) => (
              <View key={i} style={{ flex: 1 }} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
