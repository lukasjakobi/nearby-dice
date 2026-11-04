import { useTranslation } from 'react-i18next';

import { IconButton, IconName } from '@/ui';

/** Lobby header, right side: sound and vibration; the rules live on the `LobbyHero`. */
export function LobbyHeaderActions({ onSettings }: { onSettings: () => void }) {
  const { t } = useTranslation();

  return <IconButton icon={IconName.Settings} label={t('settings.title')} onPress={onSettings} />;
}
