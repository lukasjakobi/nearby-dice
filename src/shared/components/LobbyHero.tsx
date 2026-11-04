import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { PresetId } from '@/domain';
import { Icon, IconName, RADIUS, Text, TextVariant, useTheme } from '@/ui';

import { PRESET_ICON } from './presetIcons';
import { RoundCodeBoxes } from './RoundCodeBoxes';

type LobbyHeroProps = {
  code: string;
  preset: PresetId;
  /** The host changes the mode here; without it the mode only opens the rules. */
  onChangePreset?: () => void;
  onRules: () => void;
};

/**
 * The top of both lobbies: the round code on dice for everyone at the table to read, and below
 * it the mode and its rules, the one place either is reached from.
 */
export function LobbyHero({ code, preset, onChangePreset, onRules }: LobbyHeroProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const title = t(`labels.preset.${preset}.title`);

  return (
    <View
      style={{
        backgroundColor: colors.primary,
        borderRadius: RADIUS.dialog,
        paddingTop: 18,
        paddingBottom: 12,
        paddingHorizontal: 12,
        alignItems: 'center',
        gap: 14,
      }}
    >
      <View
        accessible
        accessibilityLabel={t('lobby.codeSpoken', { code: code.split('').join(' ') })}
        style={{ alignItems: 'center', gap: 14 }}
      >
        <Text size={13} weight={600} color="onPrimary" style={{ letterSpacing: 1.5 }}>
          {t('lobby.roundCode').toUpperCase()}
        </Text>
        <RoundCodeBoxes code={code} boxWidth={54} />
        <Text
          variant={TextVariant.Body}
          size={14}
          color="onPrimary"
          align="center"
          style={{ paddingHorizontal: 8, opacity: 0.85 }}
        >
          {t('lobby.codeHint')}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignSelf: 'stretch', gap: 8 }}>
        <Pressable
          onPress={onChangePreset ?? onRules}
          accessibilityRole="button"
          accessibilityLabel={
            onChangePreset
              ? `${t('common.changeStyle')}, ${title}`
              : `${t('hostSetup.styleLabel')}: ${title}`
          }
          style={({ pressed }) => ({
            flex: 1,
            minHeight: 48,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 14,
            borderRadius: RADIUS.button,
            backgroundColor: colors.onPrimary,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Icon name={PRESET_ICON[preset]} color={colors.primary} size={22} strokeWidth={2} />
          <Text
            variant={TextVariant.BodyStrong}
            color="primary"
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {title}
          </Text>
          {onChangePreset ? (
            <Icon name={IconName.ChevronRight} color={colors.primary} size={18} />
          ) : null}
        </Pressable>
        <Pressable
          onPress={onRules}
          accessibilityRole="button"
          accessibilityLabel={t('lobby.rulesButton')}
          style={({ pressed }) => ({
            minHeight: 48,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 14,
            borderRadius: RADIUS.button,
            // Outlined: reading the rules sits beside, not on par with, the mode itself.
            borderWidth: 1.5,
            borderColor: colors.onPrimary,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Icon name={IconName.Info} color={colors.onPrimary} size={18} strokeWidth={2} />
          <Text variant={TextVariant.Label} color="onPrimary">
            {t('lobby.rulesButton')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
