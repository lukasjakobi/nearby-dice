import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { PresetId } from '@/domain';
import { PresetRow } from '@/shared';
import { Button, ButtonVariant, Footer } from '@/ui';

import { RematchAction } from '../hooks';
import type { VoteChip } from '../hooks';
import { RematchVoteChip } from './RematchVoteChip';

type ResultsFooterProps = {
  /** The next game's mode; only the host (or the Training player) can change it. */
  preset: PresetId;
  onChangePreset?: () => void;
  action: RematchAction;
  votes: VoteChip[];
  waitingText: string;
  leaveLabel: string;
  onVote: () => void;
  onRestart: () => void;
  onLeave: () => void;
};

/**
 * The bottom bar, kept to two rows so the results above stay in view: the mode beside everyone's
 * rematch vote, then the leave button beside this player's one action.
 */
export function ResultsFooter({
  preset,
  onChangePreset,
  action,
  votes,
  waitingText,
  leaveLabel,
  onVote,
  onRestart,
  onLeave,
}: ResultsFooterProps) {
  const { t } = useTranslation();
  // Leave and this player's action share the row equally.
  const half = { height: 48, style: styles.half };
  const actions: Record<RematchAction, ReactNode> = {
    [RematchAction.Vote]: <Button {...half} label={t('results.rematch')} onPress={onVote} />,
    [RematchAction.Restart]: (
      <Button {...half} label={t('results.training.again')} onPress={onRestart} />
    ),
    // The badges show who is still deciding, so the long waiting text is only read out.
    [RematchAction.Waiting]: (
      <Button
        {...half}
        label={t('results.rematch')}
        onPress={onVote}
        variant={ButtonVariant.Tonal}
        loading
        accessibilityHint={waitingText}
      />
    ),
  };

  return (
    <Footer style={styles.footer}>
      <View style={styles.info}>
        <PresetRow preset={preset} onPress={onChangePreset} compact />
        {votes.length > 0 ? (
          <View style={styles.votes} accessibilityLiveRegion="polite">
            {votes.map((chip) => (
              <RematchVoteChip key={chip.id} chip={chip} />
            ))}
          </View>
        ) : null}
      </View>
      <View style={styles.actions}>
        <Button {...half} label={leaveLabel} onPress={onLeave} variant={ButtonVariant.Secondary} />
        {actions[action]}
      </View>
    </Footer>
  );
}

const styles = StyleSheet.create({
  footer: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  info: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  votes: { flexDirection: 'row', gap: 2 },
  actions: { flexDirection: 'row', gap: 10 },
  half: { flex: 1, paddingHorizontal: 12 },
});
