/**
 * Triple mode on "Spielstand" and "Verlauf": every per-sheet value is shown raw;
 * only the total applies the sheet factors.
 */
import { Category } from '@/domain/enums';
import { PRESETS, PresetId } from '@/domain/rules';
import { playerTotal } from '@/domain/scoring';
import type { Dice } from '@/domain/scoring';
import { HistoryKind } from '@/domain/engine';
import type { GameState, HistoryEntry } from '@/domain/engine';
import { LUKAS, ANTONIA, game, snapshot } from '@/test/fixtures';
import { t } from '@/test/i18n';

import { buildScoreboard } from '../view';

const rules = PRESETS[PresetId.Triple];

const UPPER_63 = {
  [Category.Ones]: 3,
  [Category.Twos]: 6,
  [Category.Threes]: 9,
  [Category.Fours]: 12,
  [Category.Fives]: 15,
  [Category.Sixes]: 18,
};

/** Lukas: Full House on all three sheets (25, 25, struck), 63 upper points on sheet ×2. */
function filled(): GameState {
  const state = game([LUKAS, ANTONIA], rules);

  return {
    ...state,
    players: state.players.map((p) =>
      p.id === LUKAS.id
        ? {
            ...p,
            sheets: p.sheets.map((s, i) => ({
              ...s,
              extraYatzys: 1,
              fields: {
                ...s.fields,
                ...(i === 1 ? UPPER_63 : {}),
                [Category.FullHouse]: i === 2 ? 0 : 25,
              },
            })),
          }
        : p,
    ),
  };
}

const board = (state: GameState) => buildScoreboard(t, snapshot({ game: state }))!;
const row = (state: GameState, key: string) => board(state).rows.find((r) => r.key === key)!;

test('raw field values per sheet; open fields stay "–", strikes stay 0', () => {
  expect(row(filled(), Category.FullHouse).cells).toEqual(['25 · 25 · 0', '– · – · –']);
  expect(row(filled(), Category.Sixes).cells[0]).toBe('– · 18 · –');
});

test('earned upper bonus and progress towards 63 are raw', () => {
  const state = filled();
  const lukas = state.players.find((p) => p.id === LUKAS.id)!;
  lukas.sheets[0] = {
    ...lukas.sheets[0],
    fields: { ...lukas.sheets[0].fields, [Category.Ones]: 2 },
  };
  expect(row(state, 'bonus').cells[0]).toBe('2 / 63 · 35 · 0 / 63');
});

test('extra Yatzy bonus is raw', () => {
  expect(row(filled(), 'yatzy-bonus').cells[0]).toBe('50 · 50 · 50');
});

test('the total is the weighted player total', () => {
  const state = filled();
  const sheets = state.players.find((p) => p.id === LUKAS.id)!.sheets;
  // Sheet ×1: 25 + 50; sheet ×2: 63 + 35 + 25 + 50; sheet ×3: 0 + 50.
  const expected = 75 * 1 + 173 * 2 + 50 * 3;
  expect(playerTotal(sheets, rules)).toBe(expected);
  expect(row(state, 'total').cells[0]).toBe(String(expected));
});

test('history points are raw', () => {
  const entry = (seq: number, sheet: number): HistoryEntry => ({
    seq,
    round: 1,
    playerId: LUKAS.id,
    kind: HistoryKind.Scored,
    category: Category.FullHouse,
    sheet,
    points: 25,
    dice: [2, 2, 5, 5, 5] as unknown as Dice,
  });
  const state = { ...filled(), history: [entry(1, 0), entry(2, 1), entry(3, 2)] };
  expect(board(state).history.map((h) => h.points)).toEqual([25, 25, 25]);
});
