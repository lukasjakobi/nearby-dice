import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { PresetSheet } from '@/shared';
import { Dialog, Screen } from '@/ui';

import {
  AwardTiles,
  ResultsFooter,
  ResultsHeader,
  ScoreComparison,
  StandingsCard,
  TrainingFacts,
} from './components';
import { useResults } from './hooks';

export function ResultsScreen() {
  const { t } = useTranslation();
  const results = useResults();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <ResultsHeader
          winners={results.winners}
          crown={results.crown}
          headline={results.headline}
          summary={results.summary}
        />
        {results.facts ? (
          <TrainingFacts facts={results.facts} />
        ) : (
          <>
            <StandingsCard standings={results.standings} />
            <AwardTiles awards={results.awards} />
          </>
        )}
        <ScoreComparison columns={results.rows} rows={results.compare} />
      </ScrollView>

      <ResultsFooter
        preset={results.preset}
        onChangePreset={results.openPreset}
        action={results.action}
        votes={results.votes}
        waitingText={results.waitingText}
        leaveLabel={results.leaveLabel}
        onVote={results.vote}
        onRestart={results.restart}
        onLeave={results.askLeave}
      />

      <PresetSheet
        visible={results.presetOpen}
        value={results.preset}
        presets={results.presets}
        onChange={results.choosePreset}
        onClose={results.closePreset}
      />
      <Dialog
        visible={results.leaveOpen}
        title={results.dialog.title}
        body={results.dialog.body}
        confirm={{ label: results.dialog.confirm, onPress: results.confirmLeave }}
        cancel={{ label: t('common.cancel'), onPress: results.cancelLeave }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16, gap: 18 },
});
