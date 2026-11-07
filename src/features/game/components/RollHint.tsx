import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { FIXED, Icon, IconName, Text, TextVariant } from '@/ui';

import { ROLL_TILE_HEIGHT } from './rollTile';

type RollHintProps = {
  label: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * No roll left, so nothing to press or slide: a caption in the roll tile's place, with an arrow
 * pointing up at the scorecard, where the turn goes on.
 */
export function RollHint({ label, style }: RollHintProps) {
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={[
        {
          height: ROLL_TILE_HEIGHT,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        },
        style,
      ]}
    >
      <Icon name={IconName.ArrowUp} color={FIXED.onFelt} size={18} strokeWidth={2.4} />
      <Text variant={TextVariant.BodyStrong} color={{ raw: FIXED.onFelt }}>
        {label}
      </Text>
    </View>
  );
}
