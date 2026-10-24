/** Triple mode on the game screen: the confirm bar and toasts show raw points. */
import { act, fireEvent, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { Category } from '@/domain/enums';
import { PRESETS, PresetId } from '@/domain/rules';
import { SessionContext } from '@/features/session/SessionContext';
import { renderScreen, fakeSession } from '@/test/render';
import { ActionType, LUKAS, ANTONIA, game, play, snapshot, withDice } from '@/test/fixtures';

import { GameScreen } from '../GameScreen';

const rules = PRESETS[PresetId.Triple];

test('the confirm bar on the ×3 sheet shows raw points', async () => {
  const snap = snapshot({
    game: withDice(game([LUKAS, ANTONIA], rules), [2, 2, 5, 5, 5]),
  });
  const session = fakeSession(snap);
  await renderScreen(<GameScreen />, { session, snapshot: snap });

  await fireEvent.press(screen.getByText('×3'));
  await fireEvent.press(screen.getByLabelText('Full House: 25 Punkte eintragen'));
  expect(screen.getByText('Eintragen')).toBeTruthy();
  expect(screen.getAllByText('25 Punkte').length).toBeGreaterThan(0);
  await fireEvent.press(screen.getByText('Eintragen'));
  expect(session.score).toHaveBeenCalledWith(Category.FullHouse, 2);
});

test("the toast for another player's entry shows raw points", async () => {
  const antoniaRolled = withDice(
    play(game([LUKAS, ANTONIA], rules), { type: ActionType.Skip, playerId: LUKAS.id }),
    [2, 2, 5, 5, 5],
  );
  const snap = snapshot({ game: antoniaRolled });
  const session = fakeSession(snap);
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

  const scored = play(antoniaRolled, {
    type: ActionType.Score,
    by: ANTONIA.id,
    category: Category.FullHouse,
    sheet: 2,
  });
  // Stored and shown raw.
  expect(
    scored.players.find((p) => p.id === ANTONIA.id)!.sheets[2].fields[Category.FullHouse],
  ).toBe(25);
  await act(() => updateSnapshot(snapshot({ game: scored })));
  expect(screen.getByText('Antonia: Full House 25')).toBeTruthy();
});
