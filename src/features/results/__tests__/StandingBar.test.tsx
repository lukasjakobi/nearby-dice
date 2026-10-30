import { act, fireEvent, screen } from '@testing-library/react-native';

import { Category } from '@/domain/enums';
import { LUKAS, ANTONIA, game } from '@/test/fixtures';
import { t } from '@/test/i18n';
import { renderScreen } from '@/test/render';

import { StandingBar } from '../components';
import { buildResults } from '../view';

/** Lukas 63 + 35 + 22 = 120; Antonia 3 up and 57 below = 60, so her bar is half as long. */
function antonia() {
  const state = game([LUKAS, ANTONIA]);
  const fields: Record<string, Partial<Record<Category, number>>> = {
    [LUKAS.id]: {
      [Category.Ones]: 3,
      [Category.Twos]: 6,
      [Category.Threes]: 9,
      [Category.Fours]: 12,
      [Category.Fives]: 15,
      [Category.Sixes]: 18,
      [Category.Chance]: 22,
    },
    [ANTONIA.id]: { [Category.Ones]: 3, [Category.Chance]: 57 },
  };
  const finished = {
    ...state,
    finished: true,
    players: state.players.map((p) => ({
      ...p,
      sheets: [{ ...p.sheets[0]!, fields: { ...p.sheets[0]!.fields, ...fields[p.id] } }],
    })),
  };

  return buildResults(t, finished, [LUKAS, ANTONIA], LUKAS.id).standings.rows.find(
    (r) => r.id === ANTONIA.id,
  )!;
}

test('a share too narrow for its number keeps its width and drops the label', async () => {
  const row = antonia();
  await renderScreen(<StandingBar row={row} background="#FFFFFF" index={0} />);
  expect(screen.queryByText('57')).toBeNull();

  // 300 px track: her bar is 150 px, so 3 of 60 points is about 7 px and 57 about 140 px.
  await act(() =>
    fireEvent(screen.getByLabelText(row.barLabel), 'layout', {
      nativeEvent: { layout: { width: 300, height: 26 } },
    }),
  );

  expect(screen.getByText('57')).toBeTruthy();
  expect(screen.queryByText('3')).toBeNull();
});
