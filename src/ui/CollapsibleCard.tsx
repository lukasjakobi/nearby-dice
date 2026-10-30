import { useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FadeIn } from './FadeIn';
import { Icon, IconName } from './icons/Icon';
import { Text, TextVariant } from './Text';
import { useTheme } from './theme/ThemeProvider';

type CollapsibleCardProps = { title: string; children: ReactNode };

/** A card that shows only its title until it is opened. */
export function CollapsibleCard({ title, children }: CollapsibleCardProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.toggle}
      >
        <Text variant={TextVariant.BodyStrong} size={16} style={styles.title}>
          {title}
        </Text>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <Icon name={IconName.ChevronDown} color={colors.ink} size={20} strokeWidth={2.4} />
        </View>
      </Pressable>

      {open ? <FadeIn>{children}</FadeIn> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 14,
  },
  title: { flex: 1, minWidth: 0 },
});
