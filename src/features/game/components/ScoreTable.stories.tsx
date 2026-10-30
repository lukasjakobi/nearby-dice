import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { PresetId } from '@/domain';
import { i18n } from '@/i18n';

import { SIX_PLAYERS, gameScene } from './fixtures';
import { ScoreTable } from './ScoreTable';

const meta: Meta<typeof ScoreTable> = {
  title: 'Features/Game/Scoreboard/ScoreTable',
  component: ScoreTable,
  decorators: [
    (Story) => (
      <View style={{ maxHeight: 620 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ScoreTable>;

export const ThreePlayers: Story = {
  render: () => <ScoreTable board={gameScene(i18n.t, { turns: 20 }).board} />,
};

/** The columns do not fit: they scroll sideways while the field names stay put. */
export const SixPlayers: Story = {
  render: () => <ScoreTable board={gameScene(i18n.t, { players: SIX_PLAYERS, turns: 30 }).board} />,
};

/** Three sheets per player: one value per sheet in each cell. */
export const Triple: Story = {
  render: () => (
    <ScoreTable board={gameScene(i18n.t, { preset: PresetId.Triple, turns: 24 }).board} />
  ),
};
