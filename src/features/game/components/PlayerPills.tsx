import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { Avatar, Font, Tag, Text, alpha, fontFamily, useTheme } from '@/ui';
import type { Palette } from '@/ui';

import type { PillView } from '../view';
import { usePlayerPillLayout } from '../hooks';

type PlayerPillsProps = {
  pills: PillView[];
  onSelect: (playerId: string) => void;
};

/**
 * One pill per player: initial, name, running total. The player whose turn it is has a
 * primary border and a dot on their avatar. When space is tight, avatars stack above names and
 * scores; Training's lone pill keeps its own size and gets a tag. Tapping a pill opens that
 * player's sheet; while it is open, their pill is tinted and outlined in their colour.
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
            pills.length === 1 && styles.lonePill,
            compact && styles.compactPill,
            pillColors(pill, colors),
            { opacity: pill.dimmed ? 0.5 : 1 },
          ]}
        >
          <View>
            <Avatar
              initial={pill.avatar.initial}
              color={pill.avatar.color}
              size={compact ? 24 : 30}
            />
            {/* Whose turn it is, without relying on the border colour alone. */}
            {pill.active ? (
              <View
                style={[
                  styles.turnDot,
                  { backgroundColor: colors.primary, borderColor: colors.bg },
                ]}
              />
            ) : null}
          </View>
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
      {/* Training's one player: say so, since nothing else on the board differs. */}
      {pills.length === 1 ? (
        <View style={styles.lone}>
          <Tag label={t('home.training')} background="surface2" color="ink" />
        </View>
      ) : null}
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
  turnDot: {
    position: 'absolute',
    right: -3,
    bottom: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  // Training's one player: a pill as wide as its content, not a banner across the screen.
  lonePill: { flex: 0, minWidth: 140, alignSelf: 'flex-start' },
  lone: { justifyContent: 'center' },
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
