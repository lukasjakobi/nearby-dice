import { StyleSheet, View } from 'react-native';

import {
  Avatar,
  Bob,
  Font,
  Icon,
  IconName,
  Pop,
  Text,
  TextVariant,
  fontFamily,
  useTheme,
} from '@/ui';

import type { RankRow } from '../view';

type ResultsHeaderProps = {
  /** More than one on a tie; their avatars overlap. */
  winners: RankRow[];
  /** The crown marks a win, or a new best in Training. */
  crown: boolean;
  headline: string;
  summary: string;
};

/** The winner's avatar with a crown, the headline and "236 Punkte · 13 Runden". */
export function ResultsHeader({ winners, crown, headline, summary }: ResultsHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <Pop>
        <View style={styles.avatars}>
          {winners.map((winner, i) => (
            <View
              key={winner.id}
              style={[styles.ring, { borderColor: colors.accent }, i > 0 && styles.overlap]}
            >
              <View style={[styles.gap, { borderColor: colors.bg }]}>
                <Avatar initial={winner.avatar.initial} color={winner.avatar.color} size={56} />
              </View>
            </View>
          ))}
          {crown ? (
            <View style={styles.crown}>
              <Bob tilt={8} distance={5}>
                <View style={[styles.crownBadge, { backgroundColor: colors.accent }]}>
                  <Icon name={IconName.Crown} color={colors.onAccent} size={18} strokeWidth={1.4} />
                </View>
              </Bob>
            </View>
          ) : null}
        </View>
      </Pop>
      <View style={styles.title}>
        <Text
          size={30}
          accessibilityRole="header"
          style={{ fontFamily: fontFamily(Font.Display, 700), lineHeight: 33 }}
        >
          {headline}
        </Text>
        <Text variant={TextVariant.Body} size={14} color="muted">
          {summary}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 4 },
  avatars: { flexDirection: 'row' },
  ring: { borderWidth: 2, borderRadius: 999 },
  gap: { borderWidth: 3, borderRadius: 999 },
  overlap: { marginLeft: -16 },
  crown: { position: 'absolute', top: -16, right: -12 },
  crownBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, minWidth: 0, gap: 2 },
});
