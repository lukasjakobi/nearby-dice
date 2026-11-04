import type { ReactNode } from 'react';
import { View } from 'react-native';

import { IconButton } from './IconButton';
import type { IconName } from './icons/Icon';
import { Text, TextVariant } from './Text';

type HeaderProps = {
  title?: string;
  /** A quiet line under the title: when a saved game was played. */
  subtitle?: string;
  leading?: { icon: IconName; label: string; onPress: () => void };
  trailing?: ReactNode;
  variant?: TextVariant;
};

/** Back/close button, title, optional action on the right. */
export function Header({
  title,
  subtitle,
  leading,
  trailing,
  variant = TextVariant.ScreenTitle,
}: HeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: 48,
        paddingTop: 16,
        paddingBottom: 8,
        paddingHorizontal: 20,
      }}
    >
      {leading ? (
        <IconButton
          icon={leading.icon}
          label={leading.label}
          onPress={leading.onPress}
          style={{ marginLeft: -8 }}
        />
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        {title ? (
          <Text variant={variant} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant={TextVariant.Caption} color="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}
