import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { PRESET_ORDER } from '@/domain';
import type { PresetId } from '@/domain';
import { Icon, IconName, BottomSheet, Text, TextVariant, useTheme } from '@/ui';

import { PRESET_ICON } from './presetIcons';

type PresetSheetProps = {
  visible: boolean;
  value: PresetId;
  /** Which presets to offer, in display order. */
  presets?: readonly PresetId[];
  /** Picking a mode also closes the sheet. */
  onChange: (id: PresetId) => void;
  onClose: () => void;
};

/** The host's "Spielstil" list in the lobby and on the results screen; the current mode has a tick. */
export function PresetSheet({
  visible,
  value,
  presets = PRESET_ORDER,
  onChange,
  onClose,
}: PresetSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View accessibilityRole="radiogroup" accessibilityLabel={t('hostSetup.styleLabel')}>
        {presets.map((id) => {
          const selected = id === value;

          return (
            <Pressable
              key={id}
              onPress={() => onChange(id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 54,
                paddingHorizontal: 4,
                borderTopWidth: 1,
                borderTopColor: colors.line,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 24, alignItems: 'center' }}>
                  <Icon
                    name={PRESET_ICON[id]}
                    color={selected ? colors.primary : colors.ink}
                    size={22}
                    strokeWidth={2}
                  />
                </View>
                <Text variant={TextVariant.Body} size={17} weight={selected ? 600 : 500}>
                  {t(`labels.preset.${id}.title`)}
                </Text>
              </View>
              {selected ? (
                <Icon name={IconName.Check} color={colors.primary} size={22} strokeWidth={3} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}
