import { ActionType } from '@/domain/engine';
import type { GameState } from '@/domain/engine';
import { Category, Link } from '@/domain/enums';
import { PRESETS, PresetId } from '@/domain/rules';
import type { Dice } from '@/domain/roll';
import { Role } from '@/session/types';
import { ANTONIA, JONAS, LUKAS, game, play, snapshot, withDice } from '@/test/fixtures';
import { t } from '@/test/i18n';

import { CellState, ControlKind, buildGameView } from '../view';
import type { ViewedSheet } from '../view';

const local = (viewed: ViewedSheet | null, dice: number[] = [0, 0, 0, 0, 0]) => ({
  sheetIndex: 0,
  viewed,
  shownDice: dice as unknown as Dice,
  shownRolled: dice.some((d) => d > 0),
  rolling: false,
  rollPending: false,
  scorePending: false,
  selectedCategory: null,
});

const ROLL = [3, 3, 3, 5, 5];
const triple = () => game([LUKAS, ANTONIA], PRESETS[PresetId.Triple]);
const cells = (view: ReturnType<typeof buildGameView>) => [
  ...view!.sheet.upper,
  ...view!.sheet.lower,
];

describe('a sheet opened from the pills', () => {
  test('shows only that player’s entries, with tabs of its own', () => {
    const view = buildGameView(
      t,
      snapshot({ game: withDice(triple(), ROLL) }),
      local({ playerId: ANTONIA.id, sheetIndex: 2 }, ROLL),
    )!;
    expect(view.viewingOther).toBe(true);
    expect(view.sheet.title).toBe('Antonias Blatt');
    expect(view.sheet.selectedTab).toBe(2);
    expect(view.sheet.tabsEnabled).toBe(true);
    expect(view.sheet.turnTab).toBeNull();
    expect(cells(view).every((cell) => cell.state === CellState.Open && !cell.pickable)).toBe(true);
  });

  test('marks its pill as shown while the turn stays with its player', () => {
    const view = buildGameView(
      t,
      snapshot({ game: triple() }),
      local({ playerId: ANTONIA.id, sheetIndex: 0 }),
    )!;
    expect(view.pills.map(({ id, active, shown }) => ({ id, active, shown }))).toEqual([
      { id: LUKAS.id, active: true, shown: false },
      { id: ANTONIA.id, active: false, shown: true },
    ]);
  });

  test('keeps the dice and my selected field of my turn', () => {
    const view = buildGameView(t, snapshot({ game: withDice(game([LUKAS, ANTONIA]), ROLL) }), {
      ...local({ playerId: ANTONIA.id, sheetIndex: 0 }, ROLL),
      selectedCategory: Category.FullHouse,
    })!;
    expect(view.sheet.focused).toBeNull();
    expect(view.selectedCell).toMatchObject({ category: Category.FullHouse, value: '25' });
    expect(view.dice.every((die) => die.locked)).toBe(true);
    expect(view.control.kind).toBe(ControlKind.MyTurn);
  });

  test('on someone else’s turn the bar still says what they do', () => {
    const lukasPicks = play(withDice(game([LUKAS, ANTONIA]), ROLL), {
      type: ActionType.Focus,
      by: LUKAS.id,
      focus: { category: Category.FullHouse, sheet: 0 },
    });
    const view = buildGameView(
      t,
      snapshot({ game: lukasPicks, myId: ANTONIA.id, role: Role.Guest }),
      local({ playerId: ANTONIA.id, sheetIndex: 0 }, ROLL),
    )!;
    expect(view.sheet.title).toBe('Dein Blatt');
    expect(view.selectedCell).toBeNull();
    expect(view.control).toMatchObject({ text: 'Lukas wählt Full House …' });
  });
});

describe('the card follows the turn', () => {
  test('for the player whose turn it is', () => {
    const view = buildGameView(
      t,
      snapshot({ game: triple() }),
      local({ playerId: LUKAS.id, sheetIndex: 2 }),
    )!;
    expect(view.viewingOther).toBe(false);
    expect(view.sheet.title).toBe('Dein Blatt');
    expect(view.sheet.selectedTab).toBe(0);
  });

  test('for a player removed from the game', () => {
    const three: GameState = game([LUKAS, ANTONIA, JONAS]);
    const view = buildGameView(
      t,
      snapshot({ game: three, players: [LUKAS, { ...ANTONIA, link: Link.Removed }, JONAS] }),
      local({ playerId: ANTONIA.id, sheetIndex: 0 }),
    )!;
    expect(view.viewingOther).toBe(false);
    expect(view.sheet.title).toBe('Dein Blatt');
  });
});
