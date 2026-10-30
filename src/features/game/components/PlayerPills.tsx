import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { Avatar, Font, Text, alpha, fontFamily, useTheme } from '@/ui';
import type { Palette } from '@/ui';

import type { PillView } from '../view';
import { usePlayerPillLayout } from '../hooks';

type PlayerPillsProps = {
  pills: PillView[];
  onSelect: (playerId: string) => void;
};

/**
 * One pill per player: initial, name, running total. The player whose turn it is has a
 * primary border. When space is tight, avatars stack above names and scores.
 * Tapping a pill opens that player's sheet; while it is open, their pill
 * is tinted and outlined in their colour.
 */
export function PlayerPills({ pills, onSelect }: PlayerPillsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { compact, onLayout } = usePlayerPillLayout(pills.length);

  return (
    <View
      onLayout={onLayout}
      style={[styles.row, compact && styles.compactRow]}
      accessibilityRole="list"
      accessibilityLabel={t('game.players')}
    >
      {pills.map((pill) => (
        <Pressable
          key={pill.id}
          onPress={() => onSelect(pill.id)}
          accessibilityRole="button"
          accessibilityLabel={`${pill.name}: ${pill.total}`}
          accessibilityState={{ selected: pill.shown }}
          style={[
            styles.pill,
            compact && styles.compactPill,
            pillColors(pill, colors),
            { opacity: pill.dimmed ? 0.5 : 1 },
          ]}
        >
          <Avatar
            initial={pill.avatar.initial}
            color={pill.avatar.color}
            size={compact ? 24 : 30}
          />
          <View style={[styles.text, compact && styles.compactText]}>
            <Text
              size={compact ? 11 : 12}
              weight={600}
              numberOfLines={1}
              align={compact ? 'center' : 'left'}
            >
              {pill.name}
            </Text>
            <Text
              size={compact ? 14 : 16}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              align={compact ? 'center' : 'left'}
              style={{ fontFamily: fontFamily(Font.Display, 600) }}
            >
              {String(pill.total)}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * A pill whose sheet is on the card is filled; opened from the pills, it is tinted in the
 * player's colour.
 */
function pillColors(pill: PillView, colors: Palette): ViewStyle {
  if (pill.active) {
    return {
      backgroundColor: pill.shown ? colors.surface : 'transparent',
      borderColor: colors.primary,
    };
  }

  return pill.shown
    ? { backgroundColor: alpha(pill.avatar.color, 0.2), borderColor: pill.avatar.color }
    : { backgroundColor: 'transparent', borderColor: colors.line };
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  pill: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
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
  compactRow: { gap: 4 },
  compactPill: {
    flexDirection: 'column',
    gap: 4,
    paddingVertical: 6,
    paddingLeft: 2,
    paddingRight: 2,
    borderRadius: 16,
  },
  compactText: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', alignSelf: 'stretch' },
});
