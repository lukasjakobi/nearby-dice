import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { i18n } from '@/i18n';

import { gameScene } from './fixtures';
import { StandingTile } from './StandingTile';

const meta: Meta<typeof StandingTile> = {
  title: 'Features/Game/Scoreboard/StandingTile',
  component: StandingTile,
  decorators: [
    (Story) => (
      <View style={{ width: 120, flexDirection: 'row' }}>
        <Story />
      </View>
    ),
  ],
  args: { onSelect: fn() },
};

export default meta;
type Story = StoryObj<typeof StandingTile>;

const players = () => gameScene(i18n.t, { turns: 20 }).board.players;

/** The lead wears a crown. */
export const Leading: Story = {
  render: (args) => <StandingTile {...args} player={players()[0]} selected={false} />,
};

export const Selected: Story = {
  render: (args) => <StandingTile {...args} player={players()[1]} selected />,
};
