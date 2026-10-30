import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { i18n } from '@/i18n';

import { stats } from './fixtures';
import { StatsRow } from './StatsRow';

const meta: Meta<typeof StatsRow> = {
  title: 'Features/Home/StatsRow',
  component: StatsRow,
};

export default meta;

/** Wins, best score (with its mode) and Yatzys, slightly tilted like dice. */
export const Default: StoryObj<typeof StatsRow> = {
  render: () => <StatsRow stats={stats(i18n.t)} />,
};
