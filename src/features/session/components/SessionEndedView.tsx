import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, IconName, Screen, StatusTone, StatusView } from '@/ui';
import { setActiveSession } from '@/session';

/** A guest's session ended by the host: removed, lobby closed or game ended. */
export function SessionEndedView({ title, body }: { title: string; body: string }) {
  const { t } = useTranslation();

  return (
    <Screen>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28 }}>
        <StatusView
          icon={IconName.Warning}
          tone={StatusTone.Danger}
          title={title}
          body={body}
          alert
          actions={<Button label={t('common.homeButton')} onPress={() => setActiveSession(null)} />}
        />
      </View>
    </Screen>
  );
}
