import { useTranslation } from 'react-i18next';

import type { StandingsView } from '../view';
import { BarLegend } from './BarLegend';
import { ResultsCard } from './ResultsCard';
import { StandingRow } from './StandingRow';

/** "Endstand": every player in ranking order, with where their points came from. */
export function StandingsCard({ standings }: { standings: StandingsView }) {
  const { t } = useTranslation();

  return (
    <ResultsCard
      title={t('results.standings')}
      radius={24}
      trailing={<BarLegend parts={standings.legend} />}
    >
      {standings.rows.map((row, i) => (
        <StandingRow key={row.id} row={row} index={i} />
      ))}
    </ResultsCard>
  );
}
