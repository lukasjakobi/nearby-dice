import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Dialog, IconName, Screen, Section, Text, TextVariant } from '@/ui';

import type { Home } from '../hooks';
import { ActionTile } from './ActionTile';
import { HomeHeader } from './HomeHeader';
import { NewPlayerCard } from './NewPlayerCard';
import { RecentGames } from './RecentGames';
import { ResumeBanner } from './ResumeBanner';
import { ResumeSheet } from './ResumeSheet';
import { StatsModeChips } from './StatsModeChips';
import { StatsRow } from './StatsRow';
import { TrainingTile } from './TrainingTile';
import { WarmUpDice } from './WarmUpDice';

/** Start screen body: header, greeting, play tiles, stats and recent games. */
export function HomeContent({ home }: { home: Home }) {
  const { t } = useTranslation();
  const { resume } = home;

  return (
    <Screen>
      <HomeHeader
        profile={home.profile}
        onOpenSettings={home.openSettings}
        onEditProfile={home.editProfile}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24, gap: 18 }}
      >
        {home.interrupted ? (
          <ResumeBanner
            body={home.interrupted.body}
            onResume={resume.start}
            onDiscard={home.askDiscard}
          />
        ) : null}

        <Text variant={TextVariant.Hero} accessibilityRole="header">
          {home.greeting}
        </Text>

        <WarmUpDice />

        {home.profile ? (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <ActionTile
                label={t('home.host')}
                icon={IconName.Broadcast}
                onPress={home.host}
                primary
              />
              <ActionTile
                label={t('home.join')}
                icon={IconName.Search}
                onPress={home.join}
                primary={false}
              />
            </View>
            <TrainingTile hint={home.trainingHint} onPress={home.training} />
          </View>
        ) : (
          <NewPlayerCard onCreate={home.createProfile} />
        )}

        <Section title={t('home.statsTitle')}>
          <StatsModeChips chips={home.modeChips} />
          <StatsRow stats={home.stats} />
        </Section>
        <RecentGames rows={home.recent} />
      </ScrollView>

      {home.interrupted ? (
        <>
          <ResumeSheet
            state={resume.state}
            attempt={resume.attempt}
            host={home.interrupted.host}
            round={home.interrupted.round}
            onCancel={resume.cancel}
            onRetry={resume.start}
            onEnter={resume.enterGame}
          />
          <Dialog
            visible={home.discardOpen}
            title={t('home.discardDialog.title')}
            body={t('home.discardDialog.body', { round: home.interrupted.round })}
            confirm={{ label: t('home.discardDialog.confirm'), onPress: home.confirmDiscard }}
            cancel={{ label: t('home.discardDialog.cancel'), onPress: home.cancelDiscard }}
          />
        </>
      ) : null}
    </Screen>
  );
}
