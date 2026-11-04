import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Icon, IconName } from './icons/Icon';
import { Text, TextVariant } from './Text';
import { useTheme } from './theme/ThemeProvider';
import type { ColorToken } from './theme/tokens';

type ListRowProps = {
  title: string;
  titleColor?: ColorToken;
  subtitle?: string;
  subtitleColor?: ColorToken;
  /** Reads a changing subtitle out (an update's progress); `subtitleAlert` as an alert. */
  subtitleLive?: boolean;
  subtitleAlert?: boolean;
  /** An `IconBadge`, an avatar or nothing. */
  leading?: ReactNode;
  /** A value, a switch or a button; a pressable row without it gets a chevron. */
  trailing?: ReactNode;
  /** Below the row's main line, inside its padding: a volume slider. */
  below?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** A row inside a `ListGroup`: leading badge, title over subtitle, trailing control. */
export function ListRow({
  title,
  titleColor = 'ink',
  subtitle,
  subtitleColor = 'muted',
  subtitleLive = false,
  subtitleAlert = false,
  leading,
  trailing,
  below,
  onPress,
  accessibilityLabel,
}: ListRowProps) {
  const { colors } = useTheme();
  const content = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 }}>
        {leading}
        <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
          <Text
            variant={TextVariant.Body}
            size={16}
            weight={500}
            color={titleColor}
            numberOfLines={2}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              variant={TextVariant.Caption}
              color={subtitleColor}
              numberOfLines={2}
              accessibilityLiveRegion={subtitleLive ? 'polite' : undefined}
              accessibilityRole={subtitleAlert ? 'alert' : undefined}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {trailing}
        {onPress && !trailing ? (
          <Icon name={IconName.ChevronRight} color={colors.muted} size={18} strokeWidth={2.4} />
        ) : null}
      </View>
      {below}
    </>
  );
  const padding = { paddingHorizontal: 14, paddingVertical: 4 };

  return onPress ? (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [padding, pressed && { backgroundColor: colors.surface2 }]}
    >
      {content}
    </Pressable>
  ) : (
    <View accessibilityLabel={accessibilityLabel} style={padding}>
      {content}
    </View>
  );
}
