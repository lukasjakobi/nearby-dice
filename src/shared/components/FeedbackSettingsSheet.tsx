import { useTranslation } from 'react-i18next';
import { Button, BottomSheet } from '@/ui';

import { SwitchList } from './SwitchList';
import type { SwitchKey, SwitchRow } from './SwitchList';

type FeedbackSettingsSheetProps = {
  visible: boolean;
  rows: readonly SwitchRow[];
  onToggle: (key: SwitchKey) => void;
  onVolume: (key: SwitchKey, value: number) => void;
  onClose: () => void;
};

/** "Einstellungen" in the lobbies: sound and music levels and vibration without leaving the round. */
export function FeedbackSettingsSheet({
  visible,
  rows,
  onToggle,
  onVolume,
  onClose,
}: FeedbackSettingsSheetProps) {
  const { t } = useTranslation();

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('settings.title')}>
      <SwitchList rows={rows} onToggle={onToggle} onVolume={onVolume} />
      <Button label={t('common.close')} onPress={onClose} style={{ marginTop: 12 }} />
    </BottomSheet>
  );
}
