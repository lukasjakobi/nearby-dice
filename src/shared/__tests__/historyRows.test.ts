import { Category } from '@/domain/enums';
import { PRESETS, PresetId } from '@/domain/rules';
import type { Dice } from '@/domain/roll';
import { HistoryKind } from '@/domain/engine';
import type { HistoryEntry } from '@/domain/engine';
import { ANTONIA, LUKAS, game } from '@/test/fixtures';
import { t } from '@/test/i18n';

import { historyRows } from '../view/historyRows';

const scored = (seq: number, sheet: number): HistoryEntry => ({
  seq,
  round: 1,
  playerId: LUKAS.id,
  kind: HistoryKind.Scored,
  category: Category.FullHouse,
  sheet,
  points: 25,
  dice: [2, 2, 5, 5, 5] as unknown as Dice,
});

test('with three sheets every entry keeps its raw points', () => {
  const state = {
    ...game([LUKAS, ANTONIA], PRESETS[PresetId.Triple]),
    history: [scored(1, 0), scored(2, 1), scored(3, 2)],
  };
  const rows = historyRows(t, state, [LUKAS, ANTONIA]);
  expect(rows.map((row) => [row.seq, row.points])).toEqual([
    [3, 25],
    [2, 25],
    [1, 25],
  ]);
});
