import { act, fireEvent, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { Category } from '@/domain/enums';
import { PRESETS, PresetId } from '@/domain/rules';
import { ConnectionStatus } from '@/session/types';
import { SessionContext } from '@/features/session/SessionContext';
import { useSettingsStore } from '@/store';
import { renderScreen, fakeSession } from '@/test/render';
import { ActionType, LUKAS, ANTONIA, game, play, snapshot, withDice } from '@/test/fixtures';

import { GameScreen } from '../GameScreen';

test('rolling on my turn', async () => {
  const snap = snapshot({});
  const session = fakeSession(snap);
  await renderScreen(<GameScreen />, { session, snapshot: snap });

  expect(screen.getByText('Runde 1 von 13')).toBeTruthy();
  expect(screen.getByText('3 Würfe übrig')).toBeTruthy();
  await fireEvent.press(screen.getByText('Würfeln'));
  expect(session.roll).toHaveBeenCalled();
});

test('picking a field replaces the roll button with an inline score action', async () => {
  const snap = snapshot({ game: withDice(game([LUKAS, ANTONIA]), [2, 2, 5, 5, 5]) });
  const session = fakeSession(snap);
  await renderScreen(<GameScreen />, { session, snapshot: snap });

  await fireEvent.press(screen.getByLabelText('Full House: 25 Punkte eintragen'));
  expect(session.score).not.toHaveBeenCalled();
  // The selected field locks the dice: they cannot be held or released any more.
  await fireEvent.press(screen.getByLabelText('Würfel 1: 2'));
  expect(session.toggleHold).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Würfel festgelegt: Diese Werte werden eingetragen')).toBeTruthy();
  expect(screen.queryByText('Nochmal würfeln')).toBeNull();
  expect(screen.queryByText('Zurück')).toBeNull();
  expect(
    screen.getByRole('button', { name: 'Full House: 25 Punkte eintragen', selected: true }),
  ).toBeTruthy();
  expect(screen.getByText('25 Punkte')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Eintragen' }));
  expect(session.score).toHaveBeenCalledWith(Category.FullHouse, 0);
  // Until the entry arrives, the selection stays with a busy button instead of
  // flashing back to "Nochmal würfeln", and a second press sends nothing.
  const sending = screen.getByRole('button', { name: 'Eintragen' });
  expect(sending.props.accessibilityState).toMatchObject({ busy: true });
  expect(screen.queryByText('Nochmal würfeln')).toBeNull();
  await fireEvent.press(sending);
  expect(session.score).toHaveBeenCalledTimes(1);
});

test('a zero field offers "Streichen"', async () => {
  const snap = snapshot({ game: withDice(game([LUKAS, ANTONIA]), [1, 2, 3, 4, 6]) });
  const session = fakeSession(snap);
  await renderScreen(<GameScreen />, { session, snapshot: snap });

  await fireEvent.press(screen.getByLabelText('Yatzy: 0 Punkte eintragen'));
  await fireEvent.press(screen.getByRole('button', { name: 'Streichen' }));
  expect(session.score).toHaveBeenCalledWith(Category.Yatzy, 0);
});

test('a selection can be changed or cleared without scoring', async () => {
  const snap = snapshot({ game: withDice(game([LUKAS, ANTONIA]), [2, 2, 5, 5, 5]) });
  const session = fakeSession(snap);
  await renderScreen(<GameScreen />, { session, snapshot: snap });

  await fireEvent.press(screen.getByLabelText('Full House: 25 Punkte eintragen'));
  await fireEvent.press(screen.getByLabelText('Fünfer: 15 Punkte eintragen'));
  expect(
    screen.getByRole('button', { name: 'Full House: 25 Punkte eintragen', selected: false }),
  ).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Fünfer: 15 Punkte eintragen', selected: true }),
  ).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Fünfer: 15 Punkte eintragen'));
  expect(screen.getByText('Nochmal würfeln')).toBeTruthy();
  expect(screen.queryByText('Eintragen')).toBeNull();
  expect(session.score).not.toHaveBeenCalled();
});

test('a field can be confirmed after the final roll', async () => {
  const rolled = withDice(game([LUKAS, ANTONIA]), [2, 2, 5, 5, 5]);
  const snap = snapshot({ game: { ...rolled, turn: { ...rolled.turn, rollsUsed: 3 } } });
  const session = fakeSession(snap);
  await renderScreen(<GameScreen />, { session, snapshot: snap });

  expect(screen.getByRole('button', { name: 'Feld wählen' })).toBeDisabled();
  await fireEvent.press(screen.getByLabelText('Full House: 25 Punkte eintragen'));
  expect(screen.getByRole('button', { name: 'Eintragen' })).toBeEnabled();
  await fireEvent.press(screen.getByText('Eintragen'));
  expect(session.score).toHaveBeenCalledWith(Category.FullHouse, 0);
});

test('changing sheets clears the selection and scores on the newly selected sheet', async () => {
  const rules = PRESETS[PresetId.Triple];
  const snap = snapshot({ game: withDice(game([LUKAS, ANTONIA], rules), [2, 2, 5, 5, 5]) });
  const session = fakeSession(snap);
  await renderScreen(<GameScreen />, { session, snapshot: snap });

  await fireEvent.press(screen.getByLabelText('Full House: 25 Punkte eintragen'));
  await fireEvent.press(screen.getByText('×2'));
  expect(screen.queryByText('Eintragen')).toBeNull();
  // The ×2 sheet shows raw points too.
  await fireEvent.press(screen.getByLabelText('Full House: 25 Punkte eintragen'));
  await fireEvent.press(screen.getByText('Eintragen'));
  expect(session.score).toHaveBeenCalledWith(Category.FullHouse, 1);
});

test('the selection is shared with the other phones as it changes', async () => {
  const rules = PRESETS[PresetId.Triple];
  const snap = snapshot({ game: withDice(game([LUKAS, ANTONIA], rules), [2, 2, 5, 5, 5]) });
  const session = fakeSession(snap);
  await renderScreen(<GameScreen />, { session, snapshot: snap });

  await fireEvent.press(screen.getByLabelText('Full House: 25 Punkte eintragen'));
  expect(session.focus).toHaveBeenLastCalledWith({ category: Category.FullHouse, sheet: 0 });
  await fireEvent.press(screen.getByLabelText('Fünfer: 15 Punkte eintragen'));
  expect(session.focus).toHaveBeenLastCalledWith({ category: Category.Fives, sheet: 0 });
  await fireEvent.press(screen.getByLabelText('Fünfer: 15 Punkte eintragen'));
  expect(session.focus).toHaveBeenLastCalledWith(null);
  await fireEvent.press(screen.getByLabelText('Fünfer: 15 Punkte eintragen'));
  await fireEvent.press(screen.getByText('×2'));
  expect(session.focus).toHaveBeenLastCalledWith(null);
  expect(session.focus).toHaveBeenCalledTimes(5);
});

test.each(['next turn', 'next own turn', 'next game', 'connection lost'] as const)(
  'a stale selection cannot be confirmed after %s',
  async (change) => {
    const rolled = withDice(game([LUKAS, ANTONIA]), [2, 2, 5, 5, 5]);
    const snap = snapshot({ game: rolled });
    const session = fakeSession(snap);
    // Keep the screen mounted while its session snapshot changes.
    let updateSnapshot: (next: typeof snap) => void;
    function TestSession() {
      const [value, setValue] = useState(snap);
      updateSnapshot = setValue;

      return (
        <SessionContext.Provider value={{ session, snapshot: value }}>
          <GameScreen />
        </SessionContext.Provider>
      );
    }

    await renderScreen(<TestSession />);
    await fireEvent.press(screen.getByLabelText('Full House: 25 Punkte eintragen'));

    const nextTurn = play(rolled, { type: ActionType.Skip, playerId: LUKAS.id });
    const next = {
      'next turn': () => snapshot({ game: nextTurn }),
      'next own turn': () =>
        snapshot({
          game: withDice(
            play(nextTurn, { type: ActionType.Skip, playerId: ANTONIA.id }),
            [2, 2, 5, 5, 5],
          ),
        }),
      // The same first roll in a new game: only the game number differs.
      'next game': () => snapshot({ game: rolled, shared: { gameNumber: 2 } }),
      'connection lost': () =>
        snapshot({
          game: rolled,
          connection: { status: ConnectionStatus.Reconnecting, attempt: 1 },
        }),
    }[change]();
    await act(() => updateSnapshot(next));
    expect(screen.queryByText('Eintragen')).toBeNull();
    expect(session.score).not.toHaveBeenCalled();
  },
);

test('the game menu switches sound, music and vibration in place', async () => {
  useSettingsStore.setState({ sound: true, music: false, haptics: true });
  const snap = snapshot({});
  await renderScreen(<GameScreen />, { session: fakeSession(snap), snapshot: snap });

  await fireEvent.press(screen.getByLabelText('Menü'));
  await fireEvent.press(screen.getByRole('switch', { name: 'Töne' }));
  await fireEvent.press(screen.getByRole('switch', { name: 'Hintergrundmusik' }));
  await fireEvent.press(screen.getByRole('switch', { name: 'Vibration' }));
  expect(useSettingsStore.getState()).toMatchObject({ sound: false, music: true, haptics: false });
  expect(screen.getByRole('switch', { name: 'Hintergrundmusik', checked: true })).toBeTruthy();
});

test('the game menu shows a volume slider for each enabled sound switch', async () => {
  useSettingsStore.setState({ sound: true, music: false, soundVolume: 0.7 });
  const snap = snapshot({});
  await renderScreen(<GameScreen />, { session: fakeSession(snap), snapshot: snap });

  await fireEvent.press(screen.getByLabelText('Menü'));
  expect(screen.queryByRole('adjustable', { name: 'Hintergrundmusik' })).toBeNull();
  const slider = screen.getByRole('adjustable', { name: 'Töne', value: { text: '70 %' } });

  await fireEvent(slider, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
  expect(useSettingsStore.getState().soundVolume).toBe(0.8);
  expect(screen.getByRole('adjustable', { name: 'Töne', value: { text: '80 %' } })).toBeTruthy();

  await fireEvent.press(screen.getByRole('switch', { name: 'Töne' }));
  expect(screen.queryByRole('adjustable', { name: 'Töne' })).toBeNull();
  expect(useSettingsStore.getState().soundVolume).toBe(0.8);
});
