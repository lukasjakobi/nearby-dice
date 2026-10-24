import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, ButtonVariant, IconName, StatusTone, StatusView } from '@/ui';

type ReconnectFailedViewProps = { onReconnect: () => void; onGoHome: () => void };

/** Shown when the connection to the host could not be restored. */
export function ReconnectFailedView({ onReconnect, onGoHome }: ReconnectFailedViewProps) {
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28 }}>
      <StatusView
        icon={IconName.Warning}
        tone={StatusTone.Danger}
        title={t('lobby.reconnectFailedTitle')}
        body={t('lobby.reconnectFailedBody')}
        alert
        actions={
          <>
            <Button label={t('common.retryConnection')} onPress={onReconnect} />
            <Button
              label={t('common.homeButton')}
              onPress={onGoHome}
              variant={ButtonVariant.Secondary}
            />
          </>
        }
      />
    </View>
  );
}
