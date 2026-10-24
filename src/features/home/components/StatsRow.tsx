import { View } from 'react-native';

import { FIXED, Font, fontFamily, Icon, mix, Text, TextVariant, useTheme } from '@/ui';

import type { StatTile } from '../hooks';

export function StatsRow({ stats }: { stats: StatTile[] }) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {stats.map((stat) => (
        <View
          key={stat.label}
          accessible
          accessibilityLabel={
            stat.sub ? `${stat.label}: ${stat.value}, ${stat.sub}` : `${stat.label}: ${stat.value}`
          }
          style={{
            flex: 1,
            alignItems: 'center',
            gap: 6,
            paddingTop: 14,
            paddingBottom: 12,
            paddingHorizontal: 8,
            borderRadius: 20,
            borderWidth: 1.5,
            backgroundColor: mix(stat.tint, colors.surface, 0.2),
            borderColor: mix(stat.tint, colors.line, 0.55),
            transform: [{ rotate: `${stat.tilt}deg` }],
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: stat.tint,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={stat.icon} color={FIXED.onPlayer} size={22} strokeWidth={2} />
          </View>
          <Text size={32} style={{ fontFamily: fontFamily(Font.Display, 700), lineHeight: 34 }}>
            {String(stat.value)}
          </Text>
          <Text variant={TextVariant.Small} color="muted">
            {stat.label}
          </Text>
          {stat.sub ? (
            <Text variant={TextVariant.Small} weight={600} style={{ marginTop: -2 }}>
              {stat.sub}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}
