import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { PresetId } from '@/domain';
import { i18n } from '@/i18n';

import { gameScene } from './fixtures';
import { PlayerSheet } from './PlayerSheet';

const meta: Meta<typeof PlayerSheet> = {
  title: 'Features/Game/Scoreboard/PlayerSheet',
  component: PlayerSheet,
  decorators: [
    (Story) => (
      <View style={{ width: 320 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PlayerSheet>;

export const MidGame: Story = {
  render: () => {
    const { board } = gameScene(i18n.t, { turns: 20 });

    return <PlayerSheet player={board.players[0]} factors={board.sheetFactors} />;
  },
};

/** Three sheets: values read "a · b · c" and the upper bonus turns into a row. */
export const Triple: Story = {
  render: () => {
    const { board } = gameScene(i18n.t, { preset: PresetId.Triple, turns: 24 });

    return <PlayerSheet player={board.players[0]} factors={board.sheetFactors} />;
  },
};
