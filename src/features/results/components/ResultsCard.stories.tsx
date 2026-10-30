import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { i18n } from '@/i18n';

import { BarLegend } from './BarLegend';
import { finished } from './fixtures';
import { ResultsCard } from './ResultsCard';
import { StandingRow } from './StandingRow';

const meta: Meta<typeof ResultsCard> = {
  title: 'Features/Results/ResultsCard',
  component: ResultsCard,
};

export default meta;
type Story = StoryObj<typeof ResultsCard>;

/** The frame of "Endstand" and "Alle Felder im Vergleich": a title, rows edge to edge. */
export const WithRow: Story = {
  render: () => {
    const { standings } = finished(i18n.t);

    return (
      <ResultsCard
        title={i18n.t('results.standings')}
        trailing={<BarLegend parts={standings.legend} />}
      >
        <StandingRow row={standings.rows[0]} index={0} />
      </ResultsCard>
    );
  },
};
