import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { i18n } from '@/i18n';

import { finished } from './fixtures';
import { HistoryCard } from './HistoryCard';

const meta: Meta<typeof HistoryCard> = {
  title: 'Features/Results/HistoryCard',
  component: HistoryCard,
};

export default meta;

/** Collapsed until tapped; then every entry, newest first. */
export const Default: StoryObj<typeof HistoryCard> = {
  render: () => <HistoryCard rows={finished(i18n.t).history} />,
};
