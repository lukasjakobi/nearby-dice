import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Spinner, Text, TextVariant, useTheme } from '@/ui';

/** The bottom bar of the guest lobby: a spinner and "Warten auf den Gastgeber". */
export function WaitingForHostBar() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        minHeight: 48,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 28,
        borderTopWidth: 1,
        borderTopColor: colors.line,
      }}
    >
      <Spinner color={colors.primary} size={20} />
      <Text variant={TextVariant.Body} size={16} weight={500}>
        {t('lobby.waitingForHost')}
      </Text>
    </View>
  );
}
