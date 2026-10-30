import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { PresetId } from '@/domain';
import { i18n } from '@/i18n';

import { RematchAction } from '../hooks';
import { VOTES } from './fixtures';
import { ResultsFooter } from './ResultsFooter';

const meta: Meta<typeof ResultsFooter> = {
  title: 'Features/Results/ResultsFooter',
  component: ResultsFooter,
  parameters: { screen: true },
  args: {
    preset: PresetId.Classic,
    action: RematchAction.Vote,
    votes: VOTES,
    onVote: fn(),
    onRestart: fn(),
    onLeave: fn(),
  },
  decorators: [
    (Story) => (
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ResultsFooter>;

type LeaveKey = 'results.endHost' | 'results.endGuest' | 'results.training.home';

const labels = (leave: LeaveKey = 'results.endHost') => ({
  leaveLabel: i18n.t(leave),
  waitingText: i18n.t('results.waitingForOthers'),
});

/** The host can change the mode for the rematch. */
export const HostVoting: Story = {
  args: { onChangePreset: fn() },
  render: (args) => <ResultsFooter {...args} {...labels()} />,
};

/** A guest who voted yes: waiting for the others. */
export const GuestWaiting: Story = {
  args: { action: RematchAction.Waiting },
  render: (args) => <ResultsFooter {...args} {...labels('results.endGuest')} />,
};

/** Training: no votes, just play again. */
export const Training: Story = {
  args: { action: RematchAction.Restart, votes: [], onChangePreset: fn() },
  render: (args) => <ResultsFooter {...args} {...labels('results.training.home')} />,
};
