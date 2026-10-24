import { useTranslation } from 'react-i18next';
import { useState } from 'react';

import { Link, MIN_PLAYERS } from '@/domain';
import type { PresetId } from '@/domain';
import { useToast } from '@/ui';
import { useHostSession } from '@/features/session';
import { lobbyRows, useBackAction, useFeedbackSwitches } from '@/shared';

export enum LobbyDialog {
  None = 'none',
  Start = 'start',
  Close = 'close',
  Kick = 'kick',
}

export function useHostLobby() {
  const { t } = useTranslation();
  const { session, snapshot } = useHostSession();
  const toast = useToast();
  const [dialog, setDialog] = useState(LobbyDialog.None);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [kickId, setKickId] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const feedbackSwitches = useFeedbackSwitches();
  const { shared } = snapshot;

  const rows = lobbyRows(snapshot);
  const lost = shared.players.find((p) => p.link !== Link.Connected && p.link !== Link.Removed);
  const enough = rows.length >= MIN_PLAYERS;
  const alone = rows.length === 1;
  const nameOf = (id: string | null) => rows.find((r) => r.id === id)?.name ?? '';

  useBackAction(() => setDialog(LobbyDialog.Close));

  return {
    title: shared.roundName,
    code: shared.code,
    rows,
    count: rows.length,
    maxPlayers: shared.maxPlayers,
    freeSeat:
      rows.length < shared.maxPlayers
        ? alone
          ? { title: t('lobby.waitingTitle'), waiting: true }
          : {
              title: t('lobby.freeSeat'),
              hint: t('lobby.freeSeatHint', { max: shared.maxPlayers }),
              waiting: true,
            }
        : null,
    startHint: !enough
      ? t('lobby.startHintTooFew')
      : lost
        ? t('lobby.startHintWaiting', { name: lost.name })
        : t('lobby.startHintReady'),
    canStart: enough && !lost,
    preset: shared.preset,
    presetOpen,
    openPreset: () => setPresetOpen(true),
    closePreset: () => setPresetOpen(false),
    choosePreset: (id: PresetId) => {
      setPresetOpen(false);
      session.setPreset(id);
    },
    rulesOpen,
    openRules: () => setRulesOpen(true),
    closeRules: () => setRulesOpen(false),
    settingsOpen,
    feedbackSwitches,
    openSettings: () => setSettingsOpen(true),
    closeSettings: () => setSettingsOpen(false),

    dialog,
    menuName: menuFor ? nameOf(menuFor) : null,
    kickName: nameOf(kickId),
    openMenu: setMenuFor,
    closeMenu: () => setMenuFor(null),
    askKick: () => {
      setKickId(menuFor);
      setMenuFor(null);
      setDialog(LobbyDialog.Kick);
    },
    confirmKick: () => {
      if (kickId) {
        toast.show(t('common.removed', { name: nameOf(kickId) }));
        session.kick(kickId);
      }

      setKickId(null);
      setDialog(LobbyDialog.None);
    },
    askStart: () => setDialog(LobbyDialog.Start),
    confirmStart: () => {
      setDialog(LobbyDialog.None);
      session.start();
    },
    askClose: () => setDialog(LobbyDialog.Close),
    confirmClose: () => {
      setDialog(LobbyDialog.None);
      session.closeLobby();
    },
    dismissDialog: () => setDialog(LobbyDialog.None),
  };
}
