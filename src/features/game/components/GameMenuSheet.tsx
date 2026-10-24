import { useTranslation } from 'react-i18next';
import { Button, ButtonVariant, Sheet } from '@/ui';
import { SwitchList } from '@/shared';
import type { SwitchKey, SwitchRow } from '@/shared';

type GameMenuSheetProps = {
  visible: boolean;
  leaveLabel: string;
  switches: readonly SwitchRow[];
  onToggle: (key: SwitchKey) => void;
  onVolume: (key: SwitchKey, value: number) => void;
  onContinue: () => void;
  onLeave: () => void;
};

/** "Menü": sound switches and levels, continue playing, or leave the game (the label depends on the role). */
export function GameMenuSheet({
  visible,
  leaveLabel,
  switches,
  onToggle,
  onVolume,
  onContinue,
  onLeave,
}: GameMenuSheetProps) {
  const { t } = useTranslation();

  return (
    <Sheet visible={visible} onClose={onContinue} title={t('game.menu')}>
      <SwitchList rows={switches} onToggle={onToggle} onVolume={onVolume} />
      <Button label={t('game.continue')} onPress={onContinue} style={{ marginTop: 12 }} />
      <Button label={leaveLabel} onPress={onLeave} variant={ButtonVariant.TonalDanger} />
    </Sheet>
  );
}
