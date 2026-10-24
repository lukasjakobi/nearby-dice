import { useState } from 'react';

import { ConnectionStatus, SessionPhase, setActiveSession, toLocalTime } from '@/session';
import { useGuestSession } from '@/features/session';
import { lobbyRows, useBackAction, useFeedbackSwitches } from '@/shared';

export enum GuestLobbyView {
  Lobby = 'lobby',
  Countdown = 'countdown',
  ConnectionFailed = 'connection-failed',
}

export function useGuestLobby() {
  const { session, snapshot } = useGuestSession();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const feedbackSwitches = useFeedbackSwitches();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const { shared, connection } = snapshot;

  const view =
    connection.status === ConnectionStatus.Failed
      ? GuestLobbyView.ConnectionFailed
      : shared.phase === SessionPhase.Countdown && shared.countdownEndsAt
        ? GuestLobbyView.Countdown
        : GuestLobbyView.Lobby;

  // Back opens the leave dialog; during the countdown it does nothing.
  useBackAction(() => {
    if (view === GuestLobbyView.Lobby) setLeaveOpen(true);
  });

  const rows = lobbyRows(snapshot);

  return {
    view,
    title: shared.roundName,
    rows,
    maxPlayers: shared.maxPlayers,
    hasFreeSeat: rows.length < shared.maxPlayers,
    reconnecting: connection.status === ConnectionStatus.Reconnecting,
    attempt: connection.attempt,
    countdownEndsAt: shared.countdownEndsAt ? toLocalTime(snapshot, shared.countdownEndsAt) : 0,
    preset: shared.preset,
    rulesOpen,
    openRules: () => setRulesOpen(true),
    closeRules: () => setRulesOpen(false),
    settingsOpen,
    feedbackSwitches,
    openSettings: () => setSettingsOpen(true),
    closeSettings: () => setSettingsOpen(false),
    leaveOpen,
    askLeave: () => setLeaveOpen(true),
    cancelLeave: () => setLeaveOpen(false),
    leave: () => {
      setLeaveOpen(false);
      session.leave();
    },
    reconnect: () => session.reconnect(),
    goHome: () => setActiveSession(null),
  };
}
