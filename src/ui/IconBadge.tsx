import { View } from 'react-native';

import { Icon } from './icons/Icon';
import type { IconName } from './icons/Icon';
import { alpha } from './theme/tokens';

type IconBadgeProps = {
  icon: IconName;
  /** The icon's colour as hex; the tile behind it is a faint wash of it. */
  color: string;
  size?: number;
  /** Fills the tile with the colour and draws the icon in `onColor`. */
  solid?: boolean;
  onColor?: string;
};

/** A rounded tile holding an icon: list rows, sheet heroes, empty states. */
export function IconBadge({ icon, color, size = 36, solid = false, onColor }: IconBadgeProps) {
  return (
    <View
      accessible={false}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.32),
        backgroundColor: solid ? color : alpha(color, 0.16),
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon
        name={icon}
        color={solid && onColor ? onColor : color}
        size={Math.round(size * 0.56)}
        strokeWidth={2}
      />
    </View>
  );
}
