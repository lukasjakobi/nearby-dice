import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Avatar, Font, fontFamily, mix, Text, TextVariant, useTheme } from '@/ui';

import { signed } from '../view';
import type { RankRow } from '../view';
import { RankingPart } from './RankingPart';
import { rankingStyles } from './rankingStyles';

/** The finished game's places: one card per player with the points behind and where they came from. */
export function RankingList({ rows }: { rows: RankRow[] }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={rankingStyles.ranking}>
      {rows.map((row) => (
        <View
          key={row.id}
          style={[
            styles.card,
            {
              backgroundColor: row.winner
                ? mix(colors.accent, colors.surface, 0.22)
                : colors.surface,
              borderColor: row.winner ? colors.accent : colors.line,
            },
          ]}
        >
          <View style={styles.top}>
            <Text
              size={22}
              color="muted"
              align="center"
              style={[styles.place, { fontFamily: fontFamily(Font.Display, 700) }]}
            >
              {String(row.place)}
            </Text>
            <Avatar initial={row.avatar.initial} color={row.avatar.color} size={40} />
            <Text variant={TextVariant.BodyStrong} size={17} style={rankingStyles.flex}>
              {row.name}
              {row.isMe ? <Text color="muted" weight={500}>{` ${t('results.you')}`}</Text> : null}
            </Text>
            <View style={styles.points}>
              <Text size={28} style={{ fontFamily: fontFamily(Font.Display, 700) }}>
                {String(row.points)}
              </Text>
              {row.winner ? null : (
                <Text variant={TextVariant.Body} size={13} color="muted">
                  {t('results.behind', { n: row.behind })}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.parts}>
            <RankingPart label={t('results.upper')} value={String(row.upper)} />
            <RankingPart label={t('results.bonus')} value={signed(row.bonus)} />
            <RankingPart label={t('results.lower')} value={String(row.lower)} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  place: { width: 24 },
  points: { alignItems: 'flex-end' },
  parts: { flexDirection: 'row', gap: 8 },
});
