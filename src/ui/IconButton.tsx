import { Pressable } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Icon } from './icons/Icon';
import type { IconName } from './icons/Icon';
import { useTheme } from './theme/ThemeProvider';
import { SIZE } from './theme/tokens';
import type { ColorToken } from './theme/tokens';

type IconButtonProps = {
  icon: IconName;
  /** Required: icon-only buttons need a spoken label. */
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Filled circle with a border (start screen header). */
  filled?: boolean;
  color?: ColorToken;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  label,
  onPress,
  disabled = false,
  filled = false,
  color = 'ink',
  size = SIZE.iconButton,
  style,
}: IconButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={4}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: filled ? colors.surface : 'transparent',
          borderWidth: filled ? 1 : 0,
          borderColor: colors.control,
          opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
          transform: [{ scale: pressed && !disabled ? 0.92 : 1 }],
        },
        style,
      ]}
    >
      <Icon
        name={icon}
        color={colors[color]}
        size={filled ? 22 : 24}
        strokeWidth={filled ? 2 : 2.2}
      />
    </Pressable>
  );
}
