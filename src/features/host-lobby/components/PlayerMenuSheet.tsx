import { useTranslation } from 'react-i18next';
import { Button, ButtonVariant, Sheet } from '@/ui';

type PlayerMenuSheetProps = {
  visible: boolean;
  /** The player's name, shown as the sheet title. */
  title: string;
  onKick: () => void;
  onClose: () => void;
};

/** The ⋯ menu of a player row in the host lobby: remove the player. */
export function PlayerMenuSheet({ visible, title, onKick, onClose }: PlayerMenuSheetProps) {
  const { t } = useTranslation();

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <Button
        label={t('lobby.kickAction')}
        onPress={onKick}
        variant={ButtonVariant.TonalDanger}
        alignStart
      />
      <Button label={t('common.close')} onPress={onClose} variant={ButtonVariant.Secondary} />
    </Sheet>
  );
}
