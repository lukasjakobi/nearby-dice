import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, IconName, Screen, StatusView } from '@/ui';
import { EndReason, setActiveSession } from '@/session';

/** The reasons a guest sees this for; leaving on purpose goes straight home. */
type ShownEndReason = Exclude<EndReason, EndReason.Left>;

const ICONS: Record<ShownEndReason, IconName> = {
  [EndReason.Kicked]: IconName.User,
  [EndReason.LobbyClosed]: IconName.Broadcast,
  [EndReason.GameEnded]: IconName.Dice,
};

/** A guest's session ended by the host: removed, lobby closed or game ended. */
export function SessionEndedView({ reason }: { reason: ShownEndReason }) {
  const { t } = useTranslation();

  return (
    <Screen>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28 }}>
        <StatusView
          icon={ICONS[reason]}
          title={t(`errors.sessionEnd.${reason}.title`)}
          body={t(`errors.sessionEnd.${reason}.body`)}
          actions={<Button label={t('common.homeButton')} onPress={() => setActiveSession(null)} />}
        />
      </View>
    </Screen>
  );
}
