import { Pressable, View } from 'react-native';

import { Font, fontFamily, Icon, IconName, Text, useTheme } from '@/ui';

type ActionTileProps = { label: string; icon: IconName; onPress: () => void; primary: boolean };

/** "Hosten" / "Beitreten": big tiles with a faint die in the corner. */
export function ActionTile({ label, icon, onPress, primary }: ActionTileProps) {
  const { colors } = useTheme();
  const background = primary ? colors.primary : colors.accent;
  const foreground = primary ? colors.onPrimary : colors.onAccent;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 148,
        padding: 16,
        borderRadius: 24,
        backgroundColor: background,
        justifyContent: 'flex-end',
        gap: 4,
        overflow: 'hidden',
        transform: [{ translateY: pressed ? 1 : 0 }],
      })}
    >
      <View
        style={{
          position: 'absolute',
          top: -10,
          right: -8,
          width: 84,
          height: 84,
          borderRadius: 20,
          backgroundColor: foreground,
          opacity: 0.2,
          transform: [{ rotate: primary ? '14deg' : '-12deg' }],
        }}
      />
      <Icon name={icon} color={foreground} size={30} strokeWidth={2} />
      <Text
        color={{ raw: foreground }}
        size={24}
        style={{ fontFamily: fontFamily(Font.Display, 600), lineHeight: 30 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
