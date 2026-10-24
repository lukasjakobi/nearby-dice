import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { RematchVote } from '@/session';
import { Avatar, Icon, IconName, Spinner, Text, TextVariant, useTheme } from '@/ui';
import type { Palette } from '@/ui';

import type { VoteChip } from '../hooks';

const VOTE_BADGE: Record<
  RematchVote,
  (c: Palette) => { background: string; color: string; icon: IconName | null }
> = {
  [RematchVote.Pending]: (c) => ({ background: c.surface2, color: c.ink, icon: null }),
  [RematchVote.Yes]: (c) => ({ background: c.primary, color: c.onPrimary, icon: IconName.Check }),
  [RematchVote.No]: (c) => ({ background: c.danger, color: c.onDanger, icon: IconName.Close }),
};

/** One player's rematch vote: the avatar with a status badge and the name below. */
export function RematchVoteChip({ chip }: { chip: VoteChip }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const badge = VOTE_BADGE[chip.vote](colors);

  return (
    <View
      accessible
      accessibilityLabel={t('results.voteA11y', {
        name: chip.name,
        state: t(`results.voteState.${chip.vote}`),
      })}
      style={[styles.vote, { opacity: chip.vote === RematchVote.No ? 0.4 : 1 }]}
    >
      <View>
        <Avatar initial={chip.avatar.initial} color={chip.avatar.color} />
        <View style={[styles.badge, { backgroundColor: badge.background, borderColor: colors.bg }]}>
          {badge.icon ? (
            <Icon name={badge.icon} color={badge.color} size={12} strokeWidth={4} />
          ) : (
            <Spinner color={badge.color} size={12} strokeWidth={4} />
          )}
        </View>
      </View>
      <Text variant={TextVariant.Small}>{chip.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  vote: { alignItems: 'center', gap: 4 },
  badge: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
