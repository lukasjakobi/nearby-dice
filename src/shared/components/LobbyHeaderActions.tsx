import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, ButtonVariant, IconButton, IconName } from '@/ui';

/** Lobby header, right side: settings icon and the "Regeln" button. */
export function LobbyHeaderActions({
  onSettings,
  onRules,
}: {
  onSettings: () => void;
  onRules: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <IconButton icon={IconName.Settings} label={t('settings.title')} onPress={onSettings} />
      <Button
        label={t('lobby.rulesButton')}
        onPress={onRules}
        variant={ButtonVariant.Secondary}
        height={44}
        style={{ paddingHorizontal: 14, borderRadius: 12 }}
      />
    </View>
  );
}
