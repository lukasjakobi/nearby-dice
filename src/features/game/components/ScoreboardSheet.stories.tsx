import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { i18n } from '@/i18n';

import { gameScene } from './fixtures';
import { ScoreboardSheet } from './ScoreboardSheet';

const meta: Meta<typeof ScoreboardSheet> = {
  title: 'Features/Game/Scoreboard/ScoreboardSheet',
  component: ScoreboardSheet,
  parameters: { screen: true },
  args: { visible: true, onClose: fn() },
};

export default meta;
type Story = StoryObj<typeof ScoreboardSheet>;

/** "Spielstand" with the table; switch to "Verlauf" for the history. */
export const MidGame: Story = {
  render: (args) => <ScoreboardSheet {...args} board={gameScene(i18n.t, { turns: 20 }).board} />,
};

export const FirstRound: Story = {
  render: (args) => <ScoreboardSheet {...args} board={gameScene(i18n.t, { turns: 0 }).board} />,
};
