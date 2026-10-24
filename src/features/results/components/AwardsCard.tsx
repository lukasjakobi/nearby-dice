import { StyleSheet, View } from 'react-native';

import { Avatar, Icon, IconName, mix, Text, TextVariant, useTheme } from '@/ui';

import { AwardKind } from '../view';
import type { Award } from '../view';

const AWARD_ICON: Record<AwardKind, IconName> = {
  [AwardKind.BestMove]: IconName.Star,
  [AwardKind.Bonus]: IconName.CheckCircle,
  [AwardKind.Zeros]: IconName.CloseCircle,
};

/** A few highlights of the game: highest entry, upper bonus, most zeros. */
export function AwardsCard({ awards }: { awards: Award[] }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      {awards.map((award, i) => (
        <View
          key={award.kind}
          accessible
          accessibilityLabel={`${award.label}: ${award.text}`}
          style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}
        >
          <View style={[styles.icon, { backgroundColor: mix(colors.ink, colors.surface, 0.08) }]}>
            <Icon name={AWARD_ICON[award.kind]} color={colors.ink} size={20} strokeWidth={2} />
          </View>
          <View style={styles.text}>
            <Text variant={TextVariant.Body} size={13} color="muted">
              {award.label}
            </Text>
            <Text variant={TextVariant.BodyStrong} size={15}>
              {award.text}
            </Text>
          </View>
          <View style={styles.who}>
            {award.who.map((avatar, j) => (
              <View
                key={avatar.id}
                style={[styles.ring, { borderColor: colors.surface }, j > 0 && styles.overlap]}
              >
                <Avatar initial={avatar.initial} color={avatar.color} size={26} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0, gap: 1 },
  who: { flexDirection: 'row' },
  ring: { borderWidth: 2, borderRadius: 999 },
  overlap: { marginLeft: -8 },
});
