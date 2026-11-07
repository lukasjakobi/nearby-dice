import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { i18n } from '@/i18n';

import { gameScene } from './fixtures';
import { HistorySheet } from './HistorySheet';

const meta: Meta<typeof HistorySheet> = {
  title: 'Features/Game/HistorySheet',
  component: HistorySheet,
  parameters: { screen: true },
  args: { visible: true, onClose: fn() },
};

export default meta;
type Story = StoryObj<typeof HistorySheet>;

export const MidGame: Story = {
  render: (args) => <HistorySheet {...args} rows={gameScene(i18n.t, { turns: 20 }).history} />,
};

export const FirstRound: Story = {
  render: (args) => <HistorySheet {...args} rows={gameScene(i18n.t, { turns: 0 }).history} />,
};
