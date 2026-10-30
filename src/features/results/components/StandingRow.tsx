import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Avatar, Font, fontFamily, Icon, IconName, mix, Text, TextVariant, useTheme } from '@/ui';

import type { Standing } from '../view';
import { ResultChip } from './ResultChip';
import { StandingBar } from './StandingBar';

/** One player in "Endstand": place, name, total, gap to the winner and the points bar. */
export function StandingRow({ row, index }: { row: Standing; index: number }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const background = row.winner ? mix(colors.accent, colors.surface, 0.16) : colors.surface;
  const display = { fontFamily: fontFamily(Font.Display, 700) };

  return (
    <View style={[styles.row, { backgroundColor: background, borderTopColor: colors.line }]}>
      <View style={styles.top}>
        <View
          style={[
            styles.place,
            { backgroundColor: row.winner ? colors.accent : mix(colors.ink, background, 0.09) },
          ]}
        >
          {row.winner ? (
            <Icon name={IconName.Crown} color={colors.onAccent} size={16} strokeWidth={1.6} />
          ) : (
            <Text size={15} style={display}>
              {String(row.place)}
            </Text>
          )}
        </View>
        <Avatar initial={row.avatar.initial} color={row.avatar.color} size={40} />
        <View style={styles.who}>
          <Text variant={TextVariant.BodyStrong} size={17} style={styles.name}>
            {row.name}
            {row.isMe ? <Text color="muted" weight={500}>{` ${t('results.you')}`}</Text> : null}
          </Text>
          {row.yatzy || row.noBonus ? (
            <View style={styles.chips}>
              {row.yatzy ? (
                <ResultChip
                  label={t('labels.category.yatzy')}
                  icon={IconName.StarFilled}
                  background={mix(colors.accent, background, 0.28)}
                  color={colors.ink}
                  weight={600}
                />
              ) : null}
              {row.noBonus ? (
                <ResultChip
                  label={row.noBonus}
                  background={mix(colors.ink, background, 0.09)}
                  color={colors.muted}
                  weight={500}
                />
              ) : null}
            </View>
          ) : null}
        </View>
        <View style={styles.points}>
          <Text size={34} style={[display, styles.total]}>
            {String(row.points)}
          </Text>
          {row.gap ? (
            <Text size={13} weight={600} color={row.gap.lead ? 'ok' : 'muted'}>
              {row.gap.text}
            </Text>
          ) : null}
        </View>
      </View>
      <StandingBar row={row} background={background} index={index} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderTopWidth: 1,
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  place: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  who: { flex: 1, minWidth: 0, gap: 4 },
  name: { lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  points: { alignItems: 'flex-end', gap: 3 },
  total: { lineHeight: 36 },
});
