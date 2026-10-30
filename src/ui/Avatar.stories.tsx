import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Avatar } from './Avatar';
import { PLAYER_COLOR_HEX } from './theme/tokens';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Display/Avatar',
  component: Avatar,
  args: { initial: 'L', color: Object.values(PLAYER_COLOR_HEX)[0], size: 44 },
  argTypes: { color: { control: 'select', options: Object.values(PLAYER_COLOR_HEX) } },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {};

/** The large preview in the profile editor and onboarding. */
export const Framed: Story = { args: { size: 112, framed: true } };

/** A player who lost the connection. */
export const Dimmed: Story = { args: { dimmed: true } };

export const PlayerColours: Story = {
  render: (args) => (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {Object.values(PLAYER_COLOR_HEX).map((color, i) => (
        <Avatar key={color} {...args} color={color} initial={'LAJMSK'[i]} />
      ))}
    </View>
  ),
};
