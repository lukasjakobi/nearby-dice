/**
 * Triple mode: the card shows raw points on every sheet; the factor (×1, ×2, ×3) is
 * only the tab label and applies to the total.
 */
import { Category } from '@/domain/enums';
import { PRESETS, PresetId } from '@/domain/rules';
import { playerTotal } from '@/domain/scoring';
import type { GameState } from '@/domain/engine';
import type { Dice } from '@/domain/scoring';
import { LUKAS, ANTONIA, game, snapshot, withDice } from '@/test/fixtures';
import { t } from '@/test/i18n';

import { CellState, buildGameView } from '../view';
import type { CellView, GameView, LocalState } from '../view';

const rules = PRESETS[PresetId.Triple];
const DICE = [2, 2, 5, 5, 5];

const local = (sheetIndex: number, dice: number[] = DICE) =>
  ({
    sheetIndex,
    shownDice: dice as unknown as Dice,
    shownRolled: dice.some((d) => d > 0),
    rolling: false,
    rollPending: false,
    scorePending: false,
    recent: null,
    selectedCategory: null,
  }) as LocalState;

/** Writes raw points into Lukas's sheet `index`. */
const withFields = (
  state: GameState,
  index: number,
  fields: Partial<Record<Category, number>>,
): GameState => ({
  ...state,
  players: state.players.map((p) =>
    p.id === LUKAS.id
      ? {
          ...p,
          sheets: p.sheets.map((s, i) =>
            i === index ? { ...s, fields: { ...s.fields, ...fields } } : s,
          ),
        }
      : p,
  ),
});

const view = (state: GameState, sheetIndex: number, dice?: number[]) =>
  buildGameView(t, snapshot({ game: state }), local(sheetIndex, dice))!;

const cell = (v: GameView, category: Category): CellView =>
  [...v.sheet.upper, ...v.sheet.lower].find((c) => c.category === category)!;

describe('live previews', () => {
  const rolled = withDice(game([LUKAS, ANTONIA], rules), DICE);

  test.each([
    [0, '25', '15'],
    [1, '25', '15'],
    [2, '25', '15'],
  ])('sheet %i shows the raw points', (index, fullHouse, fives) => {
    const v = view(rolled, index);
    expect(v.sheet.selectedTab).toBe(index);
    expect(cell(v, Category.FullHouse)).toMatchObject({
      state: CellState.Preview,
      value: fullHouse,
      pickable: true,
    });
    expect(cell(v, Category.Fives).value).toBe(fives);
    expect(cell(v, Category.FullHouse).accessibilityLabel).toBe(
      `Full House: ${fullHouse} Punkte eintragen`,
    );
  });

  test('a zero stays zero ("Streichen")', () => {
    expect(cell(view(rolled, 2), Category.Yatzy)).toMatchObject({
      state: CellState.PreviewZero,
      value: '0',
    });
  });
});

describe('filled fields', () => {
  const state = withFields(
    withFields(game([LUKAS, ANTONIA], rules), 0, { [Category.Fives]: 15 }),
    2,
    {
      [Category.Fives]: 15,
      [Category.Yatzy]: 0,
    },
  );

  test('show the raw points on every sheet', () => {
    expect(cell(view(state, 0, [0, 0, 0, 0, 0]), Category.Fives)).toMatchObject({
      state: CellState.Filled,
      value: '15',
    });
    const third = view(state, 2, [0, 0, 0, 0, 0]);
    expect(cell(third, Category.Fives)).toMatchObject({
      state: CellState.Filled,
      value: '15',
      accessibilityLabel: 'Fünfer: 15 Punkte, eingetragen',
    });
    expect(cell(third, Category.Yatzy).value).toBe('0');
  });

  test('the total applies the sheet factors', () => {
    const lukas = state.players.find((p) => p.id === LUKAS.id)!;
    expect(lukas.sheets[2].fields[Category.Fives]).toBe(15);
    const total = view(state, 2, [0, 0, 0, 0, 0]).pills.find((p) => p.id === LUKAS.id)!.total;
    expect(total).toBe(15 * 1 + 15 * 3);
    expect(total).toBe(playerTotal(lukas.sheets, rules));
  });
});

describe('upper bonus', () => {
  test('the bonus and the progress towards 63 are raw on every sheet', () => {
    const state = withFields(game([LUKAS, ANTONIA], rules), 1, { [Category.Sixes]: 24 });
    const second = view(state, 1, [0, 0, 0, 0, 0]);
    expect(second.sheet.bonus).toMatchObject({ label: 'Bonus (+35)', progress: '24 / 63' });
    expect(view(state, 0, [0, 0, 0, 0, 0]).sheet.bonus).toMatchObject({
      label: 'Bonus (+35)',
      progress: '0 / 63',
    });
    expect(view(state, 2, [0, 0, 0, 0, 0]).sheet.bonus!.label).toBe('Bonus (+35)');
  });

  test('the progress counts past 63 while the bar stays full', () => {
    const state = withFields(game([LUKAS, ANTONIA], rules), 1, {
      [Category.Fours]: 16,
      [Category.Fives]: 25,
      [Category.Sixes]: 30,
    });
    expect(view(state, 1, [0, 0, 0, 0, 0]).sheet.bonus).toMatchObject({
      progress: '71 / 63',
      fraction: 1,
      reached: true,
    });
    expect(view(state, 0, [0, 0, 0, 0, 0]).sheet.bonus).toMatchObject({
      fraction: 0,
      reached: false,
    });
  });
});
