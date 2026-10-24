import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { PresetId } from '@/domain';
import { Icon, IconName, Text, TextVariant, useTheme } from '@/ui';

type PresetRowProps = {
  preset: PresetId;
  /** Opens the preset sheet; without it the row only shows the mode. */
  onPress?: () => void;
  /** Centred and a size smaller, as in the results footer; otherwise label and mode sit apart. */
  centered?: boolean;
};

/** "Spielstil  Klassisch ›": the current mode in the lobbies and on the results screen. */
export function PresetRow({ preset, onPress, centered = false }: PresetRowProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const title = t(`labels.preset.${preset}.title`);
  const size = centered ? 15 : 16;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={
        onPress ? `${t('common.changeStyle')}, ${title}` : `${t('hostSetup.styleLabel')}: ${title}`
      }
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: centered ? 'center' : 'stretch',
        justifyContent: centered ? 'center' : 'space-between',
        gap: centered ? 6 : 8,
        minHeight: 44,
        paddingHorizontal: centered ? 12 : 4,
      }}
    >
      <Text variant={TextVariant.Body} size={size} color="muted">
        {t('hostSetup.styleLabel')}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text variant={TextVariant.Body} size={size} weight={600}>
          {title}
        </Text>
        {onPress ? (
          <Icon
            name={IconName.ChevronRight}
            color={colors.muted}
            size={centered ? 16 : 18}
            strokeWidth={2.4}
          />
        ) : null}
      </View>
    </Pressable>
  );
}
