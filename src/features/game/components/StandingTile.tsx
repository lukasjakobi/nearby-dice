import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Font, Icon, IconName, RADIUS, Text, alpha, fontFamily, useTheme } from '@/ui';

import type { PlayerBoard } from '../view';

type StandingTileProps = {
  player: PlayerBoard;
  selected: boolean;
  onSelect: (id: string) => void;
};

/** One player in the standings: place (a crown for the lead), name and total. */
export function StandingTile({ player, selected, onSelect }: StandingTileProps) {
  const { colors } = useTheme();
  const tint = player.avatar.color;

  return (
    <Pressable
      onPress={() => onSelect(player.id)}
      accessibilityRole="radio"
      accessibilityLabel={player.accessibilityLabel}
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.tile,
        {
          borderColor: selected ? tint : colors.line,
          backgroundColor: selected ? alpha(tint, 0.14) : colors.surface,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.top}>
        <Avatar initial={player.avatar.initial} color={tint} size={24} />
        {player.leading ? (
          <Icon name={IconName.Crown} color={colors.accent} size={16} />
        ) : (
          <Text size={12} weight={600} color="muted">
            {`${player.place}.`}
          </Text>
        )}
      </View>
      <Text size={13} weight={selected ? 600 : 400} numberOfLines={1}>
        {player.name}
      </Text>
      <Text size={22} style={{ fontFamily: fontFamily(Font.Display, 700) }}>
        {player.total}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.cell,
    borderWidth: 1.5,
  },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.8 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
});
