import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { FadeIn, Icon, IconName, Text, useTheme } from '@/ui';

/** "Profil gespeichert." box: shown after a save, the screen returns to Start shortly after. */
export function SavedNotice() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <FadeIn>
      <View
        accessibilityRole="alert"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: colors.ok,
          borderRadius: 14,
          paddingVertical: 12,
          paddingHorizontal: 14,
        }}
      >
        <Icon name={IconName.CheckCircle} color={colors.ok} size={22} />
        <Text size={14}>{t('profile.saved')}</Text>
      </View>
    </FadeIn>
  );
}
