import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Banner, Button, ButtonVariant, Dialog, Screen, useTheme } from '@/ui';
import type { ButtonProps } from '@/ui';
import { Countdown } from '@/shared';

import { BannerKind } from './view';
import {
  ActionBar,
  ConnectionFailedOverlay,
  GameHeader,
  GameMenuSheet,
  LostPlayerSheet,
  PlayerPills,
  Scorecard,
  ScorecardScroll,
  ScoreboardSheet,
  ScreenOverlay,
  SheetBackButton,
  YatzyFlag,
} from './components';
import { GameDialog, GameSheet, useGameScreen } from './hooks';

export function GameScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const screen = useGameScreen();
  const { view } = screen;
  if (!view) return null;

  const optionsButton: ButtonProps | null =
    view.banner?.kind === BannerKind.PlayerLostHost
      ? { label: t('game.options'), onPress: screen.openLostPlayer }
      : null;

  return (
    <Screen edges={['top']}>
      <GameHeader
        roundLabel={view.roundLabel}
        onMenu={screen.openMenu}
        onScoreboard={screen.openScoreboard}
      />

      {view.banner ? (
        <View style={styles.banner}>
          <Banner
            message={view.banner.message}
            trailing={
              optionsButton ? (
                <Button
                  {...optionsButton}
                  variant={ButtonVariant.OnAccent}
                  height={36}
                  style={styles.optionsButton}
                />
              ) : null
            }
          />
        </View>
      ) : null}

      <PlayerPills pills={view.pills} onSelect={screen.viewPlayer} />
      {view.viewingOther ? <SheetBackButton onPress={screen.showTurnSheet} /> : null}

      <ScorecardScroll>
        <Scorecard
          sheet={view.sheet}
          dimmed={view.cardDimmed}
          onPick={screen.pick}
          onSelectSheet={screen.selectSheet}
        />
      </ScorecardScroll>

      <ActionBar
        dice={view.dice}
        shakeKeys={screen.shakeKeys}
        control={view.control}
        timer={view.timer}
        onToggleHold={screen.toggleHold}
        onRoll={screen.roll}
        confirm={screen.confirm}
        onConfirm={screen.confirmScore}
      />
      <ScoreboardSheet
        visible={screen.openSheet === GameSheet.Scoreboard}
        board={screen.scoreboard}
        onClose={screen.closeSheet}
      />
      <GameMenuSheet
        visible={screen.openSheet === GameSheet.Menu}
        leaveLabel={screen.leaveLabel}
        switches={screen.feedbackSwitches.rows}
        onToggle={screen.feedbackSwitches.toggle}
        onVolume={screen.feedbackSwitches.setVolume}
        onContinue={screen.closeSheet}
        onLeave={screen.askLeave}
      />
      <LostPlayerSheet
        name={screen.openSheet === GameSheet.LostPlayer ? (view.lostPlayer?.name ?? null) : null}
        canSkip={view.lostPlayer?.canSkip ?? false}
        onWait={screen.closeSheet}
        onSkip={screen.skipLostTurn}
        onRemove={screen.askRemove}
      />
      <Dialog
        visible={screen.dialog === GameDialog.Leave}
        title={`${screen.leaveLabel}?`}
        body={screen.leaveBody}
        confirm={{ label: screen.leaveLabel, onPress: screen.confirmLeave }}
        cancel={{ label: t('common.cancel'), onPress: screen.dismissDialog }}
      />
      <Dialog
        visible={screen.dialog === GameDialog.Remove}
        title={t('game.removeDialog.title', { name: view.lostPlayer?.name ?? '' })}
        body={t('game.removeDialog.body', { name: view.lostPlayer?.name ?? '' })}
        confirm={{ label: t('game.removeDialog.confirm'), onPress: screen.confirmRemove }}
        cancel={{ label: t('common.cancel'), onPress: screen.dismissDialog }}
      />

      {view.countdownEndsAt ? (
        <ScreenOverlay background={colors.primary}>
          <Countdown endsAt={view.countdownEndsAt} />
        </ScreenOverlay>
      ) : null}

      {screen.yatzyFlag ? (
        <YatzyFlag
          key={screen.yatzyFlag.seq}
          flag={screen.yatzyFlag}
          onClose={screen.closeYatzyFlag}
        />
      ) : null}

      {view.connectionFailed ? (
        <ConnectionFailedOverlay onReconnect={screen.reconnect} onGoHome={screen.goHome} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: { paddingHorizontal: 16, paddingTop: 4 },
  optionsButton: { paddingHorizontal: 12, borderRadius: 10 },
});
