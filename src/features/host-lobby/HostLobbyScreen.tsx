import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import {
  Button,
  Dialog,
  Footer,
  Header,
  Icon,
  IconName,
  Screen,
  Text,
  TextVariant,
  useTheme,
} from '@/ui';
import {
  FeedbackSettingsSheet,
  LobbyHeaderActions,
  LobbyHero,
  PlayersSection,
  PresetSheet,
  RulesSheet,
} from '@/shared';

import { PlayerMenuSheet } from './components';
import { LobbyDialog, useHostLobby } from './hooks';

export function HostLobbyScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const lobby = useHostLobby();

  return (
    <Screen>
      <Header
        title={lobby.title}
        variant={TextVariant.ScreenTitle}
        leading={{ icon: IconName.Close, label: t('lobby.closeLabel'), onPress: lobby.askClose }}
        trailing={<LobbyHeaderActions onSettings={lobby.openSettings} />}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 22 }}
      >
        <LobbyHero
          code={lobby.code}
          preset={lobby.preset}
          onChangePreset={lobby.openPreset}
          onRules={lobby.openRules}
        />
        <PlayersSection
          rows={lobby.rows}
          maxPlayers={lobby.maxPlayers}
          freeSeat={lobby.freeSeat}
          onPlayerMenu={(row) => lobby.openMenu(row.id)}
        />
      </ScrollView>

      <Footer style={{ gap: 10 }}>
        {/* What holds the start back, or a green light once nothing does. */}
        <View
          accessibilityLiveRegion="polite"
          style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}
        >
          {lobby.canStart ? (
            <Icon name={IconName.CheckCircle} color={colors.ok} size={16} strokeWidth={2.4} />
          ) : null}
          <Text
            variant={TextVariant.Caption}
            weight={lobby.canStart ? 600 : 400}
            color={lobby.canStart ? 'ok' : 'muted'}
            align="center"
          >
            {lobby.startHint}
          </Text>
        </View>
        <Button label={t('lobby.start')} onPress={lobby.start} disabled={!lobby.canStart} />
      </Footer>

      <PlayerMenuSheet
        visible={lobby.menuName !== null}
        title={lobby.menuName ?? ''}
        onKick={lobby.askKick}
        onClose={lobby.closeMenu}
      />
      <PresetSheet
        visible={lobby.presetOpen}
        value={lobby.preset}
        onChange={lobby.choosePreset}
        onClose={lobby.closePreset}
      />
      <RulesSheet visible={lobby.rulesOpen} preset={lobby.preset} onClose={lobby.closeRules} />
      <FeedbackSettingsSheet
        visible={lobby.settingsOpen}
        rows={lobby.feedbackSwitches.rows}
        onToggle={lobby.feedbackSwitches.toggle}
        onVolume={lobby.feedbackSwitches.setVolume}
        onClose={lobby.closeSettings}
      />

      <Dialog
        visible={lobby.dialog === LobbyDialog.Close}
        title={t('lobby.closeDialog.title')}
        body={t('lobby.closeDialog.body')}
        confirm={{ label: t('lobby.closeDialog.confirm'), onPress: lobby.confirmClose }}
        cancel={{ label: t('lobby.closeDialog.cancel'), onPress: lobby.dismissDialog }}
      />
      <Dialog
        visible={lobby.dialog === LobbyDialog.Kick}
        title={t('lobby.kickDialog.title', { name: lobby.kickName })}
        body={t('lobby.kickDialog.body', { name: lobby.kickName })}
        confirm={{ label: t('lobby.kickDialog.confirm'), onPress: lobby.confirmKick }}
        cancel={{ label: t('common.cancel'), onPress: lobby.dismissDialog }}
      />
    </Screen>
  );
}
