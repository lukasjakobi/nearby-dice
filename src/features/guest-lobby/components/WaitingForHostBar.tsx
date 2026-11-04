import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Avatar, Spinner, Text, TextVariant, useTheme } from '@/ui';
import type { AvatarView } from '@/shared';

/**
 * The bottom bar of the guest lobby: the host's avatar ringed by a spinner, and "Warten auf den
 * Gastgeber". Without a known host, the spinner alone.
 */
export function WaitingForHostBar({ host }: { host: AvatarView | null }) {
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
      {host ? (
        <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute' }}>
            <Spinner color={colors.primary} size={40} strokeWidth={1.6} />
          </View>
          <Avatar initial={host.initial} color={host.color} size={30} />
        </View>
      ) : (
        <Spinner color={colors.primary} size={20} />
      )}
      <Text variant={TextVariant.Body} size={16} weight={500}>
        {t('lobby.waitingForHost')}
      </Text>
    </View>
  );
}
