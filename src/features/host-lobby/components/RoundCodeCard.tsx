import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { RoundCodeBoxes } from '@/shared';
import { Text, TextVariant, useTheme } from '@/ui';

type RoundCodeCardProps = { code: string };

/** The primary-coloured card with the round code the guests type in. */
export function RoundCodeCard({ code }: RoundCodeCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
      <View
        accessible
        accessibilityLabel={t('lobby.codeSpoken', { code: code.split('').join(' ') })}
        style={{
          backgroundColor: colors.primary,
          borderRadius: 24,
          paddingTop: 18,
          paddingBottom: 16,
          paddingHorizontal: 16,
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Text size={13} weight={600} color="onPrimary" style={{ letterSpacing: 1.5 }}>
          {t('lobby.roundCode').toUpperCase()}
        </Text>
        <RoundCodeBoxes code={code} />
        <Text variant={TextVariant.Body} size={14} color="onPrimary" align="center">
          {t('lobby.codeHint')}
        </Text>
      </View>
    </View>
  );
}
