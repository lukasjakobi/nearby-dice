import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { LostPlayerSheet } from './LostPlayerSheet';

const meta: Meta<typeof LostPlayerSheet> = {
  title: 'Features/Game/LostPlayerSheet',
  component: LostPlayerSheet,
  parameters: { screen: true },
  args: { name: 'Antonia', canSkip: true, onWait: fn(), onSkip: fn(), onRemove: fn() },
};

export default meta;
type Story = StoryObj<typeof LostPlayerSheet>;

/** It is the lost player's turn: the host can skip it. */
export const TheirTurn: Story = {};

export const NotTheirTurn: Story = { args: { canSkip: false } };
