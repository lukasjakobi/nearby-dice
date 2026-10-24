import { fireEvent, screen } from '@testing-library/react-native';

import { Link } from '@/domain/enums';
import { PresetId } from '@/domain/rules';
import type { HostController } from '@/session/types';
import { SessionPhase } from '@/session/types';
import { useSettingsStore } from '@/store';
import { LUKAS, ANTONIA, snapshot } from '@/test/fixtures';
import { fakeSession, renderScreen } from '@/test/render';

import { HostLobbyScreen } from '../HostLobbyScreen';

const lobby = (players = [LUKAS]) => snapshot({ players, phase: SessionPhase.Lobby, game: null });

test('alone: waiting row and start disabled', async () => {
  const snap = lobby();
  await renderScreen(<HostLobbyScreen />, { session: fakeSession(snap), snapshot: snap });
  expect(screen.getByLabelText('Rundencode 7 K 4 M')).toBeTruthy();
  expect(screen.getByText('Warte auf Mitspieler …')).toBeTruthy();
  expect(screen.getByText('Mindestens 2 Spieler nötig.')).toBeTruthy();
});

test('two players: start asks for confirmation', async () => {
  const snap = lobby([LUKAS, ANTONIA]);
  const session = fakeSession(snap);
  await renderScreen(<HostLobbyScreen />, { session, snapshot: snap });
  expect(screen.getByText('Es kann losgehen.')).toBeTruthy();
  await fireEvent.press(screen.getByText('Spiel starten'));
  await fireEvent.press(screen.getByText('Jetzt starten'));
  expect((session as unknown as { start: jest.Mock }).start).toHaveBeenCalled();
});

test('a lost player blocks the start', async () => {
  const snap = lobby([LUKAS, { ...ANTONIA, link: Link.Lost }]);
  await renderScreen(<HostLobbyScreen />, { session: fakeSession(snap), snapshot: snap });
  expect(screen.getByText('Warte auf Wiederverbindung von Antonia …')).toBeTruthy();
  expect(screen.getByText('Verbindung unterbrochen – verbinde erneut …')).toBeTruthy();
});

test('the host can read the round rules from the header', async () => {
  const snap = lobby([LUKAS, ANTONIA]);
  await renderScreen(<HostLobbyScreen />, { session: fakeSession(snap), snapshot: snap });
  await fireEvent.press(screen.getByText('Regeln'));
  expect(screen.getByText('Regeln der Runde')).toBeTruthy();
});

test('the host can switch sound settings from the header without leaving the lobby', async () => {
  useSettingsStore.setState({ music: false });
  const snap = lobby([LUKAS, ANTONIA]);
  await renderScreen(<HostLobbyScreen />, { session: fakeSession(snap), snapshot: snap });
  await fireEvent.press(screen.getByLabelText('Einstellungen'));
  await fireEvent.press(screen.getByRole('switch', { name: 'Hintergrundmusik' }));
  expect(useSettingsStore.getState().music).toBe(true);
  expect(screen.queryByRole('switch', { name: 'Bildschirm anlassen' })).toBeNull();
});

test('the host sees the mode and switches it from the lobby', async () => {
  const snap = lobby([LUKAS, ANTONIA]);
  const session = fakeSession(snap) as HostController;
  await renderScreen(<HostLobbyScreen />, { session, snapshot: snap });
  await fireEvent.press(screen.getByLabelText('Spielstil ändern, Klassisch'));
  await fireEvent.press(screen.getByRole('radio', { name: 'Yatzy' }));
  expect(session.setPreset).toHaveBeenCalledWith(PresetId.Yatzy);
});
