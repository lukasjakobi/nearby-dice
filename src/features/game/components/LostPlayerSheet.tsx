import { useTranslation } from 'react-i18next';
import { Button, ButtonVariant, Sheet } from '@/ui';

type LostPlayerSheetProps = {
  name: string | null;
  /** Only the player whose turn it is can be skipped. */
  canSkip: boolean;
  onWait: () => void;
  onSkip: () => void;
  onRemove: () => void;
};

/** Host only: what to do about a player who lost the connection. */
export function LostPlayerSheet({ name, canSkip, onWait, onSkip, onRemove }: LostPlayerSheetProps) {
  const { t } = useTranslation();

  return (
    <Sheet
      visible={name !== null}
      onClose={onWait}
      title={t('game.lostSheetTitle', { name: name ?? '' })}
    >
      <Button label={t('game.keepWaiting')} onPress={onWait} />
      {canSkip ? (
        <Button label={t('game.skipTurn')} onPress={onSkip} variant={ButtonVariant.Tonal} />
      ) : null}
      <Button
        label={t('game.removePlayer')}
        onPress={onRemove}
        variant={ButtonVariant.DangerOutline}
      />
    </Sheet>
  );
}
