import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { RedirectTo, Route } from '@/shared';
import { Header, IconName, Screen, Text, TextVariant } from '@/ui';

import { AwardsCard, HistoryCard, RankingList, ResultsHeader, ScoreComparison } from './components';
import { useSavedGame } from './hooks';

/** A finished game opened again from "Zuletzt gespielt". */
export function SavedGameScreen() {
  const { t } = useTranslation();
  const { view, back } = useSavedGame();
  if (!view) return <RedirectTo route={Route.Home} />;

  return (
    <Screen>
      <Header
        title={view.title}
        leading={{ icon: IconName.Back, label: t('common.back'), onPress: back }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant={TextVariant.Caption} color="muted" align="center">
          {view.when}
        </Text>
        <ResultsHeader
          winners={view.winners}
          crown
          headline={view.headline}
          summary={view.summary}
        />
        <RankingList rows={view.rows} />
        <AwardsCard awards={view.awards} />
        <ScoreComparison columns={view.rows} rows={view.compare} />
        <HistoryCard rows={view.history} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 18 },
});
