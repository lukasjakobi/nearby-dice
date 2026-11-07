import { Pressable, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { EDGE, FIXED, Icon, IconName, Text, TextVariant, alpha, shade, useTheme } from '@/ui';

import { ROLL_TILE_HEIGHT, ROLL_TILE_RADIUS } from './rollTile';

type RollButtonProps = {
  label: string;
  onRoll: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * The roll control by default ("Zum Würfeln wischen" off): the mint tile is a raised button,
 * and a tap rolls. It sinks onto its edge while pressed.
 */
export function RollButton({ label, onRoll, style }: RollButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onRoll}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          height: ROLL_TILE_HEIGHT,
          borderRadius: ROLL_TILE_RADIUS,
          backgroundColor: colors.roll,
          borderBottomWidth: pressed ? 1 : EDGE,
          borderBottomColor: shade(colors.roll, 0.35),
          marginTop: pressed ? EDGE - 1 : 0,
          boxShadow: pressed
            ? undefined
            : [{ offsetX: 0, offsetY: 5, blurRadius: 10, color: alpha(FIXED.shadow, 0.2) }],
        },
        style,
      ]}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Icon name={IconName.Dice} color={colors.onRoll} size={20} />
        <Text variant={TextVariant.BodyStrong} color={{ raw: colors.onRoll }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
