import { StyleSheet, View } from 'react-native';

import { Avatar, Font, fontFamily, Text, useTheme } from '@/ui';

import type { Award } from '../view';

/** Three overlapping avatars and a "+2" still fit a tile a third of the screen wide. */
const MAX_AVATARS = 3;

/** One highlight: what it is, the number, what the number means and who got it. */
export function AwardTile({ award }: { award: Award }) {
  const { colors } = useTheme();
  const hidden = award.who.length - MAX_AVATARS;

  return (
    <View
      accessible
      accessibilityLabel={[award.label, award.value, award.sub, ...award.who.map((w) => w.name)]
        .filter(Boolean)
        .join(', ')}
      style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.line }]}
    >
      <Text size={12} color="muted" style={styles.label}>
        {award.label}
      </Text>
      <Text size={30} style={[styles.value, { fontFamily: fontFamily(Font.Display, 700) }]}>
        {award.value}
      </Text>
      <Text size={13} color="muted" style={styles.sub}>
        {award.sub}
      </Text>
      <View style={styles.who}>
        {award.who.slice(0, MAX_AVATARS).map((avatar, i) => (
          <View
            key={avatar.id}
            style={[styles.ring, { borderColor: colors.surface }, i > 0 && styles.overlap]}
          >
            <Avatar initial={avatar.initial} color={avatar.color} size={22} />
          </View>
        ))}
        {hidden > 0 ? (
          <Text size={12} weight={600} color="muted" style={styles.more}>
            {`+${hidden}`}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 0,
    minHeight: 124,
    padding: 12,
    gap: 2,
    borderWidth: 1,
    borderRadius: 20,
  },
  label: { lineHeight: 15 },
  value: { lineHeight: 33, marginTop: 4 },
  sub: { lineHeight: 16 },
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 8,
    minHeight: 34,
  },
  ring: { borderWidth: 2, borderRadius: 999 },
  overlap: { marginLeft: -8 },
  more: { marginLeft: 4 },
});
