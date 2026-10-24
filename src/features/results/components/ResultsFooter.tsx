import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { PresetId } from '@/domain';
import { PresetRow } from '@/shared';
import { Button, ButtonVariant, Footer, Spinner, Text, TextVariant, useTheme } from '@/ui';

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

/** The bottom bar: the mode, everyone's rematch vote, this player's one action and the leave button. */
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
  const { colors } = useTheme();
  const actions: Record<RematchAction, ReactNode> = {
    [RematchAction.Vote]: <Button label={t('results.rematch')} onPress={onVote} />,
    [RematchAction.Restart]: <Button label={t('results.training.again')} onPress={onRestart} />,
    [RematchAction.Waiting]: (
      <View style={styles.waiting} accessibilityLiveRegion="polite">
        <Spinner color={colors.primary} />
        <Text variant={TextVariant.Body} size={16} weight={500}>
          {waitingText}
        </Text>
      </View>
    ),
  };

  return (
    <Footer style={{ paddingHorizontal: 16 }}>
      <PresetRow preset={preset} onPress={onChangePreset} centered />
      {votes.length > 0 ? (
        <View style={styles.votes} accessibilityLiveRegion="polite">
          {votes.map((chip) => (
            <RematchVoteChip key={chip.id} chip={chip} />
          ))}
        </View>
      ) : null}
      {actions[action]}
      <Button label={leaveLabel} onPress={onLeave} variant={ButtonVariant.Secondary} height={48} />
    </Footer>
  );
}

const styles = StyleSheet.create({
  votes: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  waiting: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
