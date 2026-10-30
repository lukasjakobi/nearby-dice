import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { i18n } from '@/i18n';

import { finished } from './fixtures';
import { StandingsCard } from './StandingsCard';

const meta: Meta<typeof StandingsCard> = {
  title: 'Features/Results/StandingsCard',
  component: StandingsCard,
};

export default meta;

/** "Endstand" of a game the bots played: totals, gaps and where the points came from. */
export const Default: StoryObj<typeof StandingsCard> = {
  render: () => <StandingsCard standings={finished(i18n.t).standings} />,
};
