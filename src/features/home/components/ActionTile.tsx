import { Pressable, View } from 'react-native';

import { alpha, Font, fontFamily, Icon, IconName, Text, useTheme } from '@/ui';

type ActionTileProps = { label: string; icon: IconName; onPress: () => void; primary: boolean };

/** "Hosten" / "Beitreten": big tiles with their icon as a large watermark in the corner. */
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
        minHeight: 156,
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
          top: -14,
          right: -18,
          opacity: 0.18,
          transform: [{ rotate: primary ? '14deg' : '-12deg' }],
        }}
      >
        <Icon name={icon} color={foreground} size={112} strokeWidth={2.4} />
      </View>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          marginBottom: 'auto',
          backgroundColor: alpha(foreground, 0.16),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} color={foreground} size={26} strokeWidth={2.2} />
      </View>
      <Text
        color={{ raw: foreground }}
        size={26}
        style={{ fontFamily: fontFamily(Font.Display, 700), lineHeight: 32 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
