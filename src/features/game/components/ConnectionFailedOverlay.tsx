import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonVariant, IconName, StatusTone, StatusView, useTheme } from '@/ui';

import { ScreenOverlay } from './ScreenOverlay';

type ConnectionFailedOverlayProps = { onReconnect: () => void; onGoHome: () => void };

/** My connection gave up: retry, or back to the home screen. */
export function ConnectionFailedOverlay({ onReconnect, onGoHome }: ConnectionFailedOverlayProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <ScreenOverlay background={colors.bg}>
      <View style={styles.failed}>
        <StatusView
          icon={IconName.Warning}
          tone={StatusTone.Danger}
          title={t('game.connectionLostTitle')}
          body={t('game.connectionLostBody')}
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
    </ScreenOverlay>
  );
}

const styles = StyleSheet.create({
  failed: { flex: 1, paddingHorizontal: 20, paddingTop: 48, paddingBottom: 28 },
});
