import { useState } from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { Category } from '@/domain/enums';
import { PresetId } from '@/domain/rules';
import { Role, SessionPhase } from '@/session/types';
import type { HostController, TrainingController } from '@/session/types';
import { LUKAS, ANTONIA, game, namedPlayers, presetGame, snapshot } from '@/test/fixtures';
import { fakeSession, renderScreen } from '@/test/render';
import { useStatsStore } from '@/store/stats';
import { SessionContext } from '@/features/session/SessionContext';

import { ResultsScreen } from '../ResultsScreen';

test('equal totals: "Unentschieden!" and the whole game is saved once', async () => {
  const finished = { ...presetGame([LUKAS, ANTONIA]), finished: true };
  const snap = snapshot({ phase: SessionPhase.Finished, game: finished });
  const props = { session: fakeSession(snap), snapshot: snap };
  await renderScreen(<ResultsScreen />, props);

  expect(screen.getByText('Unentschieden!')).toBeTruthy();
  expect(useStatsStore.getState().recent).toEqual([
    {
      id: 'session-1',
      playedAt: expect.any(Number),
      myId: LUKAS.id,
      players: namedPlayers([LUKAS, ANTONIA]),
      game: finished,
    },
  ]);
  await renderScreen(<ResultsScreen />, props);
  expect(useStatsStore.getState().recent).toHaveLength(1);
});

test('a guest keeps the finished result during rematch countdown and records the next game only when it finishes', async () => {
  const emptyGame = presetGame([LUKAS, ANTONIA]);
  const finishedGame = {
    ...emptyGame,
    players: emptyGame.players.map((player) =>
      player.id === ANTONIA.id
        ? {
            ...player,
            sheets: [
              {
                ...player.sheets[0]!,
                fields: { ...player.sheets[0]!.fields, [Category.Ones]: 5 },
              },
            ],
          }
        : player,
    ),
    finished: true,
  };
  const finished = snapshot({
    role: Role.Guest,
    myId: ANTONIA.id,
    phase: SessionPhase.Finished,
    game: finishedGame,
  });
  const session = fakeSession(finished);
  let update!: (value: typeof finished) => void;
  const Harness = () => {
    const [value, setValue] = useState(finished);
    update = setValue;

    return (
      <SessionContext.Provider value={{ session, snapshot: value }}>
        <ResultsScreen />
      </SessionContext.Provider>
    );
  };

  await renderScreen(<Harness />);
  await waitFor(() => expect(useStatsStore.getState().recent).toHaveLength(1));

  const countdownGame = emptyGame;
  const countdown = snapshot({
    role: finished.role,
    myId: ANTONIA.id,
    players: [ANTONIA],
    phase: SessionPhase.Countdown,
    game: countdownGame,
    shared: { gameNumber: 2 },
  });
  await act(() => update(countdown));

  expect(useStatsStore.getState().recent).toHaveLength(1);
  expect(screen.getByText('Du gewinnst!')).toBeTruthy();

  const nextFinished = snapshot({
    role: finished.role,
    myId: ANTONIA.id,
    phase: SessionPhase.Finished,
    game: { ...countdownGame, finished: true },
    shared: { gameNumber: 2 },
  });
  await act(() => update(nextFinished));
  await waitFor(() => expect(useStatsStore.getState().recent).toHaveLength(2));
  expect(useStatsStore.getState().recent.map(({ id }) => id)).toEqual(['session-2', 'session-1']);
});

test('training: a new best, kept out of the multiplayer statistics, and "Nochmal spielen"', async () => {
  const solo = { ...LUKAS };
  const empty = game([solo]);
  const finished = {
    ...empty,
    players: empty.players.map((player) => ({
      ...player,
      sheets: [
        { ...player.sheets[0]!, fields: { ...player.sheets[0]!.fields, [Category.Sixes]: 24 } },
      ],
    })),
    finished: true,
  };
  const snap = snapshot({
    role: Role.Training,
    players: [solo],
    phase: SessionPhase.Finished,
    game: finished,
  });
  const session = fakeSession(snap);
  await renderScreen(<ResultsScreen />, { session, snapshot: snap });

  await waitFor(() => expect(screen.getByText('Neuer Bestwert!')).toBeTruthy());
  expect(useStatsStore.getState()).toMatchObject({ trainingBest: 24, modes: {}, recent: [] });
  expect(screen.getByLabelText('Bestwert im Training: 24')).toBeTruthy();

  await fireEvent.press(screen.getByText('Nochmal spielen'));
  expect((session as TrainingController).restart).toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Zur Startseite'));
  expect(session.leave).toHaveBeenCalled();
});

test('the host picks the next mode on the results screen; a guest only sees it', async () => {
  const finished = { ...presetGame([LUKAS, ANTONIA]), finished: true };
  const hostSnap = snapshot({
    phase: SessionPhase.Finished,
    game: finished,
    shared: { preset: PresetId.Blitz },
  });
  const host = fakeSession(hostSnap) as HostController;
  await renderScreen(<ResultsScreen />, { session: host, snapshot: hostSnap });
  await fireEvent.press(screen.getByLabelText('Spielstil ändern, Blitz'));
  await fireEvent.press(screen.getByRole('radio', { name: 'Klassisch XL' }));
  expect(host.setPreset).toHaveBeenCalledWith(PresetId.ClassicXl);

  await screen.unmount();
  const guestSnap = { ...hostSnap, role: Role.Guest, myId: ANTONIA.id };
  await renderScreen(<ResultsScreen />, { session: fakeSession(guestSnap), snapshot: guestSnap });
  expect(screen.getByLabelText('Spielstil: Blitz')).toBeTruthy();
  expect(screen.queryByLabelText('Spielstil ändern, Blitz')).toBeNull();
});
