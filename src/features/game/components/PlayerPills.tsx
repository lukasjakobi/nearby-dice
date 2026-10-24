import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Avatar, Font, Text, fontFamily, useTheme } from '@/ui';

import type { PillView } from '../view';

/** One pill per player: initial, name, running total. Active has a primary border. */
export function PlayerPills({ pills }: { pills: PillView[] }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.row} accessibilityRole="list" accessibilityLabel={t('game.players')}>
      {pills.map((pill) => (
        <View
          key={pill.id}
          accessible
          accessibilityLabel={`${pill.name}: ${pill.total}`}
          style={[
            styles.pill,
            {
              backgroundColor: pill.active ? colors.surface : 'transparent',
              borderColor: pill.active ? colors.primary : colors.line,
              opacity: pill.dimmed ? 0.5 : 1,
            },
          ]}
        >
          <Avatar initial={pill.avatar.initial} color={pill.avatar.color} size={30} />
          <View style={styles.text}>
            <Text size={12} weight={600} numberOfLines={1}>
              {pill.name}
            </Text>
            <Text size={16} style={{ fontFamily: fontFamily(Font.Display, 600), lineHeight: 18 }}>
              {String(pill.total)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  pill: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 10,
    borderRadius: 999,
    borderWidth: 2,
  },
  text: { flex: 1, minWidth: 0 },
});
