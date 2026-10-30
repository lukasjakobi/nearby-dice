/** "Endstand": the gap to the winner, the chips and the points bar of each row. */
import { Category } from '@/domain/enums';
import { PRESETS, PresetId } from '@/domain/rules';
import type { GameState } from '@/domain/engine';
import { LUKAS, ANTONIA, JONAS, game } from '@/test/fixtures';
import { t } from '@/test/i18n';

import { BarPart, buildResults } from '../view';

type Fields = Partial<Record<Category, number>>;

/** A finished game with each player's fields on their sheets, one entry per sheet. */
function finished(sheets: Record<string, Fields[]>, preset = PresetId.Classic): GameState {
  const players = [LUKAS, ANTONIA, JONAS].filter((p) => sheets[p.id]);
  const state = game(players, PRESETS[preset]);

  return {
    ...state,
    finished: true,
    players: state.players.map((p) => ({
      ...p,
      sheets: p.sheets.map((s, i) => ({ ...s, fields: { ...s.fields, ...sheets[p.id][i] } })),
    })),
  };
}

const standings = (state: GameState) =>
  buildResults(t, state, [LUKAS, ANTONIA, JONAS], LUKAS.id).standings;
const row = (state: GameState, id: string) => standings(state).rows.find((r) => r.id === id)!;

const UPPER_63: Fields = {
  [Category.Ones]: 3,
  [Category.Twos]: 6,
  [Category.Threes]: 9,
  [Category.Fours]: 12,
  [Category.Fives]: 15,
  [Category.Sixes]: 18,
};

test('a sole winner leads by the gap to the next, everyone else trails the winner', () => {
  const state = finished({
    [LUKAS.id]: [{ [Category.Chance]: 30 }],
    [ANTONIA.id]: [{ [Category.Chance]: 20 }],
    [JONAS.id]: [{ [Category.Chance]: 15 }],
  });

  expect(row(state, LUKAS.id).gap).toEqual({ text: '+10', lead: true });
  expect(row(state, ANTONIA.id).gap).toEqual({ text: '−10', lead: false });
  expect(row(state, JONAS.id).gap).toEqual({ text: '−15', lead: false });
});

test('tied winners show no lead', () => {
  const state = finished({
    [LUKAS.id]: [{ [Category.Chance]: 20 }],
    [ANTONIA.id]: [{ [Category.Chance]: 20 }],
  });

  expect(standings(state).rows.map((r) => r.gap)).toEqual([null, null]);
});

test('the bar leaves out empty shares and is as long as the points against the winner', () => {
  const state = finished({
    [LUKAS.id]: [{ ...UPPER_63, [Category.Chance]: 22 }],
    [ANTONIA.id]: [{ [Category.Ones]: 3, [Category.Chance]: 57 }],
  });
  const lukas = row(state, LUKAS.id);
  const antonia = row(state, ANTONIA.id);

  expect(standings(state).legend).toEqual([BarPart.Upper, BarPart.Bonus, BarPart.Lower]);
  expect(lukas.segments).toEqual([
    { part: BarPart.Upper, points: 63, label: '63' },
    { part: BarPart.Bonus, points: 35, label: '+35' },
    { part: BarPart.Lower, points: 22, label: '22' },
  ]);
  expect(lukas.barWidth).toBe(100);
  expect(antonia.segments.map((s) => s.part)).toEqual([BarPart.Upper, BarPart.Lower]);
  expect(antonia.barWidth).toBe(50);
  expect(antonia.barLabel).toBe('Antonia: 60 Punkte. Oben 3, Bonus 0, Unten 57');
});

test('the chips: Yatzy, and the missed bonus with its progress on a one-sheet game', () => {
  const state = finished({
    [LUKAS.id]: [{ ...UPPER_63, [Category.Yatzy]: 50 }],
    [ANTONIA.id]: [{ [Category.Sixes]: 24 }],
  });

  expect(row(state, LUKAS.id)).toMatchObject({ yatzy: true, noBonus: null });
  expect(row(state, ANTONIA.id)).toMatchObject({ yatzy: false, noBonus: 'Kein Bonus · 24/63' });
});

test('no bonus chip when several sheets are summed', () => {
  const state = finished(
    { [LUKAS.id]: [{ [Category.Sixes]: 24 }, {}, {}], [ANTONIA.id]: [{}, {}, {}] },
    PresetId.Triple,
  );

  expect(row(state, LUKAS.id).noBonus).toBeNull();
});
