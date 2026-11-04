import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Banner, Dialog, Header, IconName, Screen, Text, TextVariant } from '@/ui';
import {
  Countdown,
  FeedbackSettingsSheet,
  LobbyHeaderActions,
  LobbyHero,
  PlayersSection,
  RulesSheet,
  WarmUpDice,
} from '@/shared';

import { ReconnectFailedView, WaitingForHostBar } from './components';
import { GuestLobbyView, useGuestLobby } from './hooks';

export function GuestLobbyScreen() {
  const { t } = useTranslation();
  const lobby = useGuestLobby();

  if (lobby.view === GuestLobbyView.Countdown) {
    return (
      <Screen background="primary">
        <Countdown endsAt={lobby.countdownEndsAt} />
      </Screen>
    );
  }

  if (lobby.view === GuestLobbyView.ConnectionFailed) {
    return (
      <Screen>
        <ReconnectFailedView onReconnect={lobby.reconnect} onGoHome={lobby.goHome} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title={lobby.title}
        leading={{ icon: IconName.Close, label: t('lobby.leaveLabel'), onPress: lobby.askLeave }}
        trailing={<LobbyHeaderActions onSettings={lobby.openSettings} />}
      />
      {lobby.reconnecting ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 4 }}>
          <Banner
            message={t('lobby.connectionLost')}
            trailing={
              <Text variant={TextVariant.Body} weight={500} color="onAccent">
                {t('lobby.attempt', { n: lobby.attempt })}
              </Text>
            }
          />
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 16,
          gap: 22,
        }}
        style={{ opacity: lobby.reconnecting ? 0.5 : 1 }}
      >
        <LobbyHero code={lobby.code} preset={lobby.preset} onRules={lobby.openRules} />
        <PlayersSection
          rows={lobby.rows}
          maxPlayers={lobby.maxPlayers}
          freeSeat={lobby.hasFreeSeat ? { title: t('lobby.freeSeat') } : null}
        />
        {/* Something for the hands while the host gets everyone in. */}
        <WarmUpDice />
      </ScrollView>

      <WaitingForHostBar host={lobby.hostAvatar} />

      <RulesSheet visible={lobby.rulesOpen} preset={lobby.preset} onClose={lobby.closeRules} />
      <FeedbackSettingsSheet
        visible={lobby.settingsOpen}
        rows={lobby.feedbackSwitches.rows}
        onToggle={lobby.feedbackSwitches.toggle}
        onVolume={lobby.feedbackSwitches.setVolume}
        onClose={lobby.closeSettings}
      />

      <Dialog
        visible={lobby.leaveOpen}
        title={t('lobby.leaveDialog.title')}
        body={t('lobby.leaveDialog.body')}
        confirm={{ label: t('lobby.leaveDialog.confirm'), onPress: lobby.leave }}
        cancel={{ label: t('lobby.leaveDialog.cancel'), onPress: lobby.cancelLeave }}
      />
    </Screen>
  );
}
