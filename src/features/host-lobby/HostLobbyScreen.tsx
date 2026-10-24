import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { ScrollView } from 'react-native';

import {
  DEFAULT_TOAST_OFFSET,
  Button,
  Dialog,
  Footer,
  Header,
  IconName,
  Screen,
  Text,
  TextVariant,
  useToast,
} from '@/ui';
import {
  FeedbackSettingsSheet,
  LobbyHeaderActions,
  PlayersSection,
  PresetRow,
  PresetSheet,
  RulesSheet,
} from '@/shared';

import { PlayerMenuSheet, RoundCodeCard } from './components';
import { LobbyDialog, useHostLobby } from './hooks';

export function HostLobbyScreen() {
  const { t } = useTranslation();
  const lobby = useHostLobby();
  const { setOffset } = useToast();
  useEffect(() => {
    setOffset(150);

    return () => setOffset(DEFAULT_TOAST_OFFSET);
  }, [setOffset]);

  return (
    <Screen>
      <Header
        title={lobby.title}
        variant={TextVariant.ScreenTitle}
        leading={{ icon: IconName.Close, label: t('lobby.closeLabel'), onPress: lobby.askClose }}
        trailing={<LobbyHeaderActions onSettings={lobby.openSettings} onRules={lobby.openRules} />}
      />
      <RoundCodeCard code={lobby.code} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 14 }}
      >
        <PresetRow preset={lobby.preset} onPress={lobby.openPreset} />
        <PlayersSection
          rows={lobby.rows}
          maxPlayers={lobby.maxPlayers}
          freeSeat={lobby.freeSeat}
          onPlayerMenu={(row) => lobby.openMenu(row.id)}
        />
      </ScrollView>

      <Footer style={{ gap: 10 }}>
        <Text
          variant={TextVariant.Caption}
          color="muted"
          align="center"
          accessibilityLiveRegion="polite"
        >
          {lobby.startHint}
        </Text>
        <Button label={t('lobby.start')} onPress={lobby.askStart} disabled={!lobby.canStart} />
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
        visible={lobby.dialog === LobbyDialog.Start}
        destructive={false}
        title={t('lobby.startDialog.title', { n: lobby.count })}
        body={t('lobby.startDialog.body')}
        confirm={{ label: t('lobby.startDialog.confirm'), onPress: lobby.confirmStart }}
        cancel={{ label: t('lobby.startDialog.cancel'), onPress: lobby.dismissDialog }}
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
