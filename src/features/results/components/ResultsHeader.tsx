import { StyleSheet, View } from 'react-native';

import {
  Avatar,
  Bob,
  Confetti,
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
  /** "236 Punkte · 13 Runden" in Training, where no ranking shows the points. */
  summary?: string;
  /** Confetti for the game just finished; a saved game is told calmly. */
  celebrate?: boolean;
};

/** The winner's avatar with a crown over the headline, centred like a podium. */
export function ResultsHeader({
  winners,
  crown,
  headline,
  summary,
  celebrate = true,
}: ResultsHeaderProps) {
  const { colors } = useTheme();
  const size = celebrate ? 84 : 60;

  return (
    <View style={[styles.header, celebrate && styles.stage]}>
      {celebrate && crown ? <Confetti /> : null}
      <Pop>
        <View style={styles.avatars}>
          {winners.map((winner, i) => (
            <View
              key={winner.id}
              style={[styles.ring, { borderColor: colors.accent }, i > 0 && styles.overlap]}
            >
              <View style={[styles.gap, { borderColor: colors.bg }]}>
                <Avatar initial={winner.avatar.initial} color={winner.avatar.color} size={size} />
              </View>
            </View>
          ))}
          {crown ? (
            <View style={styles.crown}>
              <Bob tilt={8} distance={5}>
                <View style={[styles.crownBadge, { backgroundColor: colors.accent }]}>
                  <Icon name={IconName.Crown} color={colors.onAccent} size={20} strokeWidth={1.4} />
                </View>
              </Bob>
            </View>
          ) : null}
        </View>
      </Pop>
      <View style={styles.title}>
        <Text
          size={celebrate ? 34 : 28}
          align="center"
          accessibilityRole="header"
          style={{ fontFamily: fontFamily(Font.Display, 700), lineHeight: celebrate ? 38 : 32 }}
        >
          {headline}
        </Text>
        {summary ? (
          <Text variant={TextVariant.Body} size={15} color="muted" align="center">
            {summary}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 14, paddingHorizontal: 4 },
  stage: { paddingVertical: 16 },
  avatars: { flexDirection: 'row' },
  ring: { borderWidth: 2, borderRadius: 999 },
  gap: { borderWidth: 3, borderRadius: 999 },
  overlap: { marginLeft: -16 },
  crown: { position: 'absolute', top: -14, right: -10 },
  crownBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { alignSelf: 'stretch', gap: 4 },
});
