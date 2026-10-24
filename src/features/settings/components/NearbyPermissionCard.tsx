import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Card, Text, TextVariant } from '@/ui';

/** Connection status for the nearby permission, with a shortcut to the system settings when missing. */
export function NearbyPermissionCard({
  granted,
  onOpenSettings,
}: {
  granted: boolean;
  onOpenSettings: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Card
      border={granted ? 'line' : 'danger'}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
        paddingVertical: 8,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant={TextVariant.Body} size={16} weight={500}>
          {t('settings.nearby')}
        </Text>
        <Text variant={TextVariant.Label} color={granted ? 'ok' : 'danger'}>
          {granted ? t('settings.allowed') : t('settings.notAllowed')}
        </Text>
      </View>
      {granted ? null : (
        <Button label={t('settings.openSettings')} onPress={onOpenSettings} height={44} />
      )}
    </Card>
  );
}
