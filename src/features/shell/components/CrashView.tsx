import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonVariant, IconName, Screen, StatusTone, StatusView } from '@/ui';

type CrashViewProps = { onRetry: () => void; onHome: () => void };

/** What a crash shows instead of a blank app: try the screen again, or go back to Start. */
export function CrashView({ onRetry, onHome }: CrashViewProps) {
  const { t } = useTranslation();

  return (
    <Screen>
      <View style={styles.content}>
        <StatusView
          icon={IconName.AlertCircle}
          tone={StatusTone.Danger}
          title={t('errors.crash.title')}
          body={t('errors.crash.body')}
          alert
          actions={
            <>
              <Button label={t('common.homeButton')} onPress={onHome} />
              <Button
                label={t('errors.crash.retry')}
                onPress={onRetry}
                variant={ButtonVariant.Secondary}
              />
            </>
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28 },
});
