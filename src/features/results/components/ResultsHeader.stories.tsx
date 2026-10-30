import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { i18n } from '@/i18n';

import { finished, summary } from './fixtures';
import { ResultsHeader } from './ResultsHeader';

const meta: Meta<typeof ResultsHeader> = {
  title: 'Features/Results/ResultsHeader',
  component: ResultsHeader,
};

export default meta;
type Story = StoryObj<typeof ResultsHeader>;

/** A saved game, opened from the start screen: no summary line. */
export const SavedGame: Story = {
  render: () => {
    const view = finished(i18n.t);

    return <ResultsHeader winners={view.winners} crown headline={view.headline} />;
  },
};

/** Right after the game, with the summary line. */
export const Winner: Story = {
  render: () => {
    const view = finished(i18n.t);

    return (
      <ResultsHeader
        winners={view.winners}
        crown
        headline={view.headline}
        summary={summary(i18n.t)}
      />
    );
  },
};

/** A tie: the winners' avatars overlap. */
export const Tie: Story = {
  render: () => {
    const view = finished(i18n.t);
    const tied = view.rows.slice(0, 2);

    return (
      <ResultsHeader
        winners={tied}
        crown
        headline={i18n.t('results.tie')}
        summary={summary(i18n.t)}
      />
    );
  },
};
