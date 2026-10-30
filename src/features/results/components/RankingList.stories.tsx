import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { i18n } from '@/i18n';

import { finished } from './fixtures';
import { RankingList } from './RankingList';

const meta: Meta<typeof RankingList> = {
  title: 'Features/Results/RankingList',
  component: RankingList,
};

export default meta;

/** One card per place: points, how far behind, and upper, bonus and lower block. */
export const Default: StoryObj<typeof RankingList> = {
  render: () => <RankingList rows={finished(i18n.t).rows} />,
};
