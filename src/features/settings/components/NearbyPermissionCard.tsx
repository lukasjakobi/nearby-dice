import { useTranslation } from 'react-i18next';

import { Button, IconBadge, IconName, ListGroup, ListRow, useTheme } from '@/ui';

/** Connection status for the nearby permission, with a shortcut to the system settings when missing. */
export function NearbyPermissionCard({
  granted,
  onOpenSettings,
}: {
  granted: boolean;
  onOpenSettings: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <ListGroup style={granted ? undefined : { borderColor: colors.danger }}>
      <ListRow
        title={t('settings.nearby')}
        subtitle={granted ? t('settings.allowed') : t('settings.notAllowed')}
        subtitleColor={granted ? 'ok' : 'danger'}
        leading={
          <IconBadge icon={IconName.Bluetooth} color={granted ? colors.primary : colors.danger} />
        }
        trailing={
          granted ? undefined : (
            <Button label={t('settings.openSettings')} onPress={onOpenSettings} height={44} />
          )
        }
      />
    </ListGroup>
  );
}
