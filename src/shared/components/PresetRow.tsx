import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { PresetId } from '@/domain';
import { Icon, IconName, Text, TextVariant, useTheme } from '@/ui';

type PresetRowProps = {
  preset: PresetId;
  /** Opens the preset sheet; without it the row only shows the mode. */
  onPress?: () => void;
  /**
   * A size smaller and only as wide as its text, as in the results footer; otherwise label and
   * mode sit apart across the full width.
   */
  compact?: boolean;
};

/** "Spielstil  Klassisch ›": the current mode in the lobbies and on the results screen. */
export function PresetRow({ preset, onPress, compact = false }: PresetRowProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const title = t(`labels.preset.${preset}.title`);
  const size = compact ? 15 : 16;

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
        alignSelf: compact ? 'flex-start' : 'stretch',
        justifyContent: compact ? 'flex-start' : 'space-between',
        flexShrink: 1,
        gap: compact ? 6 : 8,
        minHeight: 44,
        paddingHorizontal: compact ? 0 : 4,
      }}
    >
      <Text variant={TextVariant.Body} size={size} color="muted">
        {t('hostSetup.styleLabel')}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, gap: 4 }}>
        {/* Native text doesn't shrink by default; without it a long mode pushes the chevron out. */}
        <Text
          variant={TextVariant.Body}
          size={size}
          weight={600}
          numberOfLines={1}
          style={{ flexShrink: 1 }}
        >
          {title}
        </Text>
        {onPress ? (
          <Icon
            name={IconName.ChevronRight}
            color={colors.muted}
            size={compact ? 16 : 18}
            strokeWidth={2.4}
          />
        ) : null}
      </View>
    </Pressable>
  );
}
