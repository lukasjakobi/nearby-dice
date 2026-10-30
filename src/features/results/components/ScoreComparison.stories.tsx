import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { i18n } from '@/i18n';

import { finished } from './fixtures';
import { ScoreComparison } from './ScoreComparison';

const meta: Meta<typeof ScoreComparison> = {
  title: 'Features/Results/ScoreComparison',
  component: ScoreComparison,
};

export default meta;

/** Collapsed until tapped; the best value in each row is highlighted. */
export const Default: StoryObj<typeof ScoreComparison> = {
  render: () => {
    const view = finished(i18n.t);

    return <ScoreComparison columns={view.rows} rows={view.compare} />;
  },
};
