/**
 * Tapping a pill opens that player's sheet on this phone only. It stays open through
 * everything the player whose turn it is does, until "Zurück" or the end of the turn.
 */
import { fireEvent, screen } from '@testing-library/react-native';

import { ActionType } from '@/domain/engine';
import type { GameState } from '@/domain/engine';
import { Category } from '@/domain/enums';
import { PRESETS, PresetId } from '@/domain/rules';
import { Role } from '@/session/types';
import { ANTONIA, LUKAS, game, play, snapshot, withDice } from '@/test/fixtures';
import { renderLiveSession } from '@/test/render';

import { GameScreen } from '../GameScreen';

const scored = (state: GameState, by: string, category: Category) =>
  play(state, { type: ActionType.Score, by, category, sheet: 0 });

/** Lukas' second turn: he has Chance (16), Antonia has Full House (25). */
const lukasAgain = scored(
  withDice(
    scored(withDice(game([LUKAS, ANTONIA]), [1, 2, 3, 4, 6]), LUKAS.id, Category.Chance),
    [2, 2, 5, 5, 5],
  ),
  ANTONIA.id,
  Category.FullHouse,
);
const rolled = withDice(lukasAgain, [3, 3, 3, 5, 5]);

const mount = (state: GameState, me: Partial<Parameters<typeof snapshot>[0]> = {}) =>
  renderLiveSession(<GameScreen />, snapshot({ game: state, ...me }));
const back = () => screen.queryByRole('button', { name: 'Zurück' });

describe('on my turn', () => {
  test('a pill opens that sheet without previews; "Zurück" brings mine back', async () => {
    await mount(rolled);
    await fireEvent.press(screen.getByRole('button', { name: 'Antonia: 25' }));

    expect(screen.getByRole('button', { name: 'Antonia: 25' })).toBeSelected();
    expect(screen.getByLabelText('Full House: 25 Punkte, eingetragen')).toBeTruthy();
    expect(screen.queryByLabelText(/Punkte eintragen$/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Nochmal würfeln' })).toBeEnabled();

    await fireEvent.press(back()!);
    expect(back()).toBeNull();
    expect(screen.getByRole('button', { name: 'Lukas: 16' })).toBeSelected();
    expect(screen.getByLabelText('Full House: 25 Punkte eintragen')).toBeTruthy();
  });

  test('my selected field can still be entered from another sheet', async () => {
    const { session } = await mount(rolled);
    await fireEvent.press(screen.getByLabelText('Full House: 25 Punkte eintragen'));
    await fireEvent.press(screen.getByRole('button', { name: 'Antonia: 25' }));

    await fireEvent.press(screen.getByRole('button', { name: 'Eintragen' }));
    expect(session.score).toHaveBeenCalledWith(Category.FullHouse, 0);
  });

  test('tapping my own pill again follows the turn', async () => {
    await mount(rolled);
    await fireEvent.press(screen.getByRole('button', { name: 'Antonia: 25' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Lukas: 16' }));
    expect(back()).toBeNull();
  });

  test('the tabs of an opened sheet turn on this phone only', async () => {
    const { session } = await mount(game([LUKAS, ANTONIA], PRESETS[PresetId.Triple]));
    await fireEvent.press(screen.getByRole('button', { name: 'Antonia: 0' }));
    await fireEvent.press(screen.getByRole('radio', { name: '×3' }));

    expect(screen.getByRole('radio', { name: '×3' })).toBeChecked();
    expect(session.viewSheet).not.toHaveBeenCalled();
  });
});

describe("on someone else's turn", () => {
  const watching = { myId: ANTONIA.id, role: Role.Guest };

  test('the opened sheet stays through their moves and closes when the turn ends', async () => {
    const { update } = await mount(lukasAgain, watching);
    await fireEvent.press(screen.getByRole('button', { name: 'Antonia: 25' }));
    expect(screen.getByLabelText('Full House: 25 Punkte, eingetragen')).toBeTruthy();

    // Lukas rolls and selects a field: my sheet stays, without his previews.
    const picking = play(rolled, {
      type: ActionType.Focus,
      by: LUKAS.id,
      focus: { category: Category.ThreeOfAKind, sheet: 0 },
    });
    await update(snapshot({ game: picking, ...watching }));
    expect(back()).toBeTruthy();
    expect(screen.getByLabelText('Full House: 25 Punkte, eingetragen')).toBeTruthy();
    expect(screen.queryByLabelText(/möglich$/)).toBeNull();
    expect(screen.getByText('Lukas wählt Dreierpasch …')).toBeTruthy();

    await update(snapshot({ game: scored(rolled, LUKAS.id, Category.ThreeOfAKind), ...watching }));
    expect(back()).toBeNull();
    expect(screen.getByRole('button', { name: 'Würfeln' })).toBeEnabled();
  });
});
