import { Pressable, StyleSheet, View } from 'react-native';

import { RADIUS, Text, TextVariant, alpha, useTheme } from '@/ui';

import type { PlayerBoard } from '../view';

type PlayerPickerProps = {
  label: string;
  players: PlayerBoard[];
  selected: string;
  onSelect: (id: string) => void;
};

/**
 * The players of "Spielstand" as wrapping pills in their colours; with six players they
 * stay on two lines instead of scrolling sideways.
 */
export function PlayerPicker({ label, players, selected, onSelect }: PlayerPickerProps) {
  const { colors } = useTheme();

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.wrap}>
      {players.map((player) => {
        const active = player.id === selected;

        return (
          <Pressable
            key={player.id}
            onPress={() => onSelect(player.id)}
            accessibilityRole="radio"
            accessibilityLabel={player.name}
            accessibilityState={{ checked: active }}
            style={[
              styles.pill,
              {
                borderColor: active ? player.color : colors.line,
                backgroundColor: active ? alpha(player.color, 0.16) : colors.surface2,
              },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: player.color }]} />
            <Text
              variant={TextVariant.Label}
              size={13}
              weight={active ? 600 : 400}
              numberOfLines={1}
              style={styles.name}
            >
              {player.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { flexShrink: 1 },
});
