import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Animated, View } from 'react-native';

import { PlayerColor } from '@/domain';
import { PLAYER_COLOR_HEX } from '@/ui';

import { FlagLetter } from './FlagLetter';
import { LETTER_BOX, STAGE_WIDTH, STILL_PHASE, STILL_SWING, layoutFlagWord } from './flagWave';

/** The flag at rest, as with reduce motion: fully unfurled, half a swing high. */
const UNFURLED = new Animated.Value(1);
const PHASE = new Animated.Value(STILL_PHASE);
const SWING = UNFURLED.interpolate({ inputRange: [0, 1], outputRange: [STILL_SWING, STILL_SWING] });

const meta: Meta<typeof FlagLetter> = {
  title: 'Features/Game/YatzyFlag/FlagLetter',
  component: FlagLetter,
  args: { color: PLAYER_COLOR_HEX[PlayerColor.Amber] },
  argTypes: { color: { control: 'select', options: Object.values(PLAYER_COLOR_HEX) } },
  decorators: [
    (Story) => (
      <View style={{ width: STAGE_WIDTH, height: LETTER_BOX + 40 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FlagLetter>;

/** One letter: drop shadow, extruded sides and the face, shaded by the wave below it. */
export const Letter: Story = {
  render: (args) => (
    <FlagLetter
      {...args}
      glyph={layoutFlagWord('Y')[0]}
      unfurl={UNFURLED}
      phase={PHASE}
      swing={SWING}
    />
  ),
};

/** The whole word, standing still. */
export const Word: Story = {
  render: (args) => (
    <>
      {layoutFlagWord('YATZY!').map((glyph, i) => (
        <FlagLetter key={i} {...args} glyph={glyph} unfurl={UNFURLED} phase={PHASE} swing={SWING} />
      ))}
    </>
  ),
};
