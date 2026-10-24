import { fireEvent, screen } from '@testing-library/react-native';

import { Category } from '@/domain/enums';
import { PRESETS, PresetId } from '@/domain/rules';
import { renderScreen, fakeSession } from '@/test/render';
import { ActionType, LUKAS, ANTONIA, game, play, snapshot } from '@/test/fixtures';

import { GameScreen } from '../GameScreen';

const triple = () => game([LUKAS, ANTONIA], PRESETS[PresetId.Triple]);

test('on my turn a tab switch is shared with the other phones', async () => {
  const snap = snapshot({ game: triple() });
  const session = fakeSession(snap);
  await renderScreen(<GameScreen />, { session, snapshot: snap });

  expect(screen.queryByTestId('sheet-tab-marker')).toBeNull();
  await fireEvent.press(screen.getByRole('radio', { name: '×3' }));
  expect(session.viewSheet).toHaveBeenCalledWith(2);
  expect(screen.getByRole('radio', { name: '×3' }).props.accessibilityState).toMatchObject({
    checked: true,
  });
  // The tab that is already open is not sent again.
  await fireEvent.press(screen.getByRole('radio', { name: '×3' }));
  expect(session.viewSheet).toHaveBeenCalledTimes(1);
});

test("on someone else's turn the tabs follow them, marked and locked", async () => {
  const antoniasTurn = play(
    triple(),
    { type: ActionType.Roll, by: LUKAS.id },
    { type: ActionType.Score, by: LUKAS.id, category: Category.Chance, sheet: 0 },
    { type: ActionType.ViewSheet, by: ANTONIA.id, sheet: 1 },
  );
  const snap = snapshot({ game: antoniasTurn });
  const session = fakeSession(snap);
  await renderScreen(<GameScreen />, { session, snapshot: snap });

  const theirs = screen.getByRole('radio', { name: '×2, Antonia ist auf diesem Blatt' });
  expect(theirs.props.accessibilityState).toMatchObject({ checked: true, disabled: true });
  expect(screen.getByTestId('sheet-tab-marker')).toBeTruthy();
  await fireEvent.press(screen.getByRole('radio', { name: '×3' }));
  expect(session.viewSheet).not.toHaveBeenCalled();
  expect(session.focus).not.toHaveBeenCalled();
  expect(
    screen.getByRole('radio', { name: '×2, Antonia ist auf diesem Blatt' }).props
      .accessibilityState,
  ).toMatchObject({ checked: true });
});
