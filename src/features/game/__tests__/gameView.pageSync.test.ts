import { ActionType } from '@/domain/engine';
import type { GameState } from '@/domain/engine';
import { Category } from '@/domain/enums';
import { DEFAULT_RULES, PRESETS, PresetId } from '@/domain/rules';
import type { Dice } from '@/domain/scoring';
import { LUKAS, ANTONIA, game, play, snapshot, withDice } from '@/test/fixtures';
import { t } from '@/test/i18n';

import { buildGameView } from '../view';

const local = (sheetIndex = 0, dice: number[] = [0, 0, 0, 0, 0]) => ({
  sheetIndex,
  shownDice: dice as unknown as Dice,
  shownRolled: dice.some((d) => d > 0),
  rolling: false,
  rollPending: false,
  scorePending: false,
  selectedCategory: null,
});

const triple = () => game([LUKAS, ANTONIA], PRESETS[PresetId.Triple]);
/** Lukas starts; this hands the turn to Antonia. */
const antoniasTurn = (): GameState =>
  play(
    triple(),
    { type: ActionType.Roll, by: LUKAS.id },
    { type: ActionType.Score, by: LUKAS.id, category: Category.Chance, sheet: 0 },
  );

describe('on my turn', () => {
  test('my own tab choice is shown, the tabs work and carry no marker', () => {
    const view = buildGameView(t, snapshot({ game: triple() }), local(2))!;
    expect(view.sheet.selectedTab).toBe(2);
    expect(view.sheet.tabsEnabled).toBe(true);
    expect(view.sheet.turnTab).toBeNull();
  });
});

describe("on someone else's turn", () => {
  test('the card follows the sheet they have open, whatever I had chosen', () => {
    const viewing = play(antoniasTurn(), { type: ActionType.ViewSheet, by: ANTONIA.id, sheet: 1 });
    const view = buildGameView(t, snapshot({ game: viewing }), local(2))!;
    expect(view.sheet.title).toBe('Antonias Blatt');
    expect(view.sheet.selectedTab).toBe(1);
    expect(view.sheet.turnTab).toEqual({ index: 1, label: 'Antonia ist auf diesem Blatt' });
    expect(view.sheet.tabsEnabled).toBe(false);
  });

  test('at the start of their turn that is the first sheet', () => {
    const view = buildGameView(t, snapshot({ game: antoniasTurn() }), local(2))!;
    expect(view.sheet.selectedTab).toBe(0);
    expect(view.sheet.turnTab?.index).toBe(0);
  });

  test('their selected field brings its sheet along', () => {
    const rolled = withDice(antoniasTurn(), [3, 3, 3, 5, 5]);
    const focused = play(rolled, {
      type: ActionType.Focus,
      by: ANTONIA.id,
      focus: { category: Category.FullHouse, sheet: 2 },
    });
    const view = buildGameView(t, snapshot({ game: focused }), local(0, [3, 3, 3, 5, 5]))!;
    expect(view.sheet.selectedTab).toBe(2);
    expect(view.sheet.turnTab?.index).toBe(2);
    expect(view.sheet.focused).toBe(Category.FullHouse);
  });

  test('a host that does not share the page yet still shows the first sheet', () => {
    const old = antoniasTurn();
    const { page: _page, ...turn } = old.turn;
    const view = buildGameView(
      t,
      snapshot({ game: { ...old, turn: turn as GameState['turn'] } }),
      local(2),
    )!;
    expect(view.sheet.selectedTab).toBe(0);
  });

  test('with a single sheet there are no tabs and no marker', () => {
    const single = play(
      game([LUKAS, ANTONIA], DEFAULT_RULES),
      { type: ActionType.Roll, by: LUKAS.id },
      { type: ActionType.Score, by: LUKAS.id, category: Category.Chance, sheet: 0 },
    );
    const view = buildGameView(t, snapshot({ game: single }), local())!;
    expect(view.sheet.tabs).toBeNull();
    expect(view.sheet.turnTab).toBeNull();
  });
});
