import { View } from 'react-native';

import { Avatar, useTheme } from '@/ui';

/** A player's avatar pinned to the corner of what they hold: the host's code, a guest's field. */
export function RoleBadge({ initial, color }: { initial: string; color: string }) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        position: 'absolute',
        top: -14,
        left: -10,
        borderRadius: 999,
        borderWidth: 3,
        borderColor: colors.bg,
      }}
    >
      <Avatar initial={initial} color={color} size={40} />
    </View>
  );
}
