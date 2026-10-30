import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { VOTES } from './fixtures';
import { RematchVoteChip } from './RematchVoteChip';

const meta: Meta<typeof RematchVoteChip> = {
  title: 'Features/Results/RematchVoteChip',
  component: RematchVoteChip,
};

export default meta;
type Story = StoryObj<typeof RematchVoteChip>;

export const Yes: Story = { args: { chip: VOTES[0] } };

/** Still deciding: a small spinner on the avatar. */
export const Pending: Story = { args: { chip: VOTES[1] } };

/** Leaves: faded, with a cross. */
export const No: Story = { args: { chip: VOTES[2] } };
