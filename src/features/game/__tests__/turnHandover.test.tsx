/**
 * Once an entry is confirmed, the next turn shows at once on every phone: the new
 * active player's sheet, fresh dice and the right action bar. Nothing of the old
 * turn (its sheet, roll, previews or pending buttons) is held on screen.
 */
import { act, fireEvent, renderHook, screen } from '@testing-library/react-native';
import { t } from '@/test/i18n';

import { ActionType, HistoryKind, NO_DICE, lastEntry } from '@/domain/engine';
import type { GameState, Turn } from '@/domain/engine';
import { Category } from '@/domain/enums';
import type { Dice } from '@/domain/scoring';
import { Role } from '@/session/types';
import type { SessionSnapshot } from '@/session/types';
import { LUKAS, ANTONIA, game, play, snapshot, withDice } from '@/test/fixtures';
import { fakeSession, renderLiveSession } from '@/test/render';

import { GameScreen } from '../GameScreen';
import { CellState, ControlKind, buildGameView } from '../view';
import { useDiceAnimation } from '../hooks';

const local = (dice: number[] = [0, 0, 0, 0, 0]) => ({
  sheetIndex: 0,
  viewed: null,
  shownDice: dice as unknown as Dice,
  shownRolled: dice.some((d) => d > 0),
  rolling: false,
  rollPending: false,
  scorePending: false,
  selectedCategory: null,
});

const scoreFullHouse = (state: GameState, by = LUKAS.id) =>
  play(state, { type: ActionType.Score, by, category: Category.FullHouse, sheet: 0 });

const rollOf = (turn: Turn, dice: number[]): Turn => ({
  ...turn,
  dice: dice as unknown as Turn['dice'],
  rollsUsed: turn.rollsUsed + 1,
  rollSeq: turn.rollSeq + 1,
});

const multi = withDice(game([LUKAS, ANTONIA]), [2, 2, 5, 5, 5]);
const solo = withDice(game([LUKAS]), [2, 2, 5, 5, 5]);

describe('the view right after an entry', () => {
  test('the scorer’s phone shows the next player’s sheet and waits for them', () => {
    const view = buildGameView(t, snapshot({ game: scoreFullHouse(multi) }), local())!;
    expect(view.sheet.title).toBe('Antonias Blatt');
    expect(
      [...view.sheet.upper, ...view.sheet.lower].every((c) => c.state === CellState.Open),
    ).toBe(true);
    expect(view.dice.every((d) => d.value === 0 && !d.locked)).toBe(true);
    expect(view.control).toMatchObject({ kind: ControlKind.Waiting, text: 'Antonia ist dran' });
  });

  test('the next player’s phone shows their own sheet and "Würfeln"', () => {
    const view = buildGameView(
      t,
      snapshot({ game: scoreFullHouse(multi), myId: ANTONIA.id, role: Role.Guest }),
      local(),
    )!;
    expect(view.sheet.title).toBe('Dein Blatt');
    expect(view.control).toMatchObject({
      kind: ControlKind.MyTurn,
      rollLabel: 'Würfeln',
      rollsLeft: 3,
      canRoll: true,
    });
  });

  test('in training the next own turn starts clean', () => {
    const written = scoreFullHouse(solo);
    const view = buildGameView(
      t,
      snapshot({ game: written, role: Role.Training, players: [LUKAS] }),
      local(),
    )!;
    expect(view.sheet.title).toBe('Dein Blatt');
    const cells = [...view.sheet.upper, ...view.sheet.lower];
    expect(cells.find((c) => c.category === Category.FullHouse)?.state).toBe(CellState.Filled);
    expect(cells.some((c) => c.pickable || c.state === CellState.Preview)).toBe(false);
    expect(view.control).toMatchObject({ kind: ControlKind.MyTurn, rollLabel: 'Würfeln' });
  });

  test('cells carry no post-entry highlight', () => {
    const view = buildGameView(t, snapshot({ game: scoreFullHouse(multi) }), local())!;
    expect(view.sheet.lower.every((c) => !('fresh' in c))).toBe(true);
  });
});

describe('the dice when the turn passes', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test.each([
    ['another player', multi],
    ['training', solo],
  ])('a turn passing mid-shake shows the new turn at once (%s)', async (_, start) => {
    const rerolled = { ...start, turn: rollOf(start.turn, [6, 6, 6, 1, 1]) };
    const { result, rerender } = await renderHook(
      ({ turn }: { turn: Turn }) => useDiceAnimation(turn),
      { initialProps: { turn: start.turn } },
    );

    // The re-roll arrives and starts shaking with the old faces still up…
    await rerender({ turn: rerolled.turn });
    expect(result.current.rolling).toBe(true);
    expect(result.current.shownDice).toEqual([2, 2, 5, 5, 5]);

    // …and the entry lands before the shake ends: no old dice, no old previews.
    await rerender({ turn: scoreFullHouse(rerolled).turn });
    expect(result.current.rolling).toBe(false);
    expect(result.current.shownRolled).toBe(false);
    expect(result.current.shownDice).toEqual(NO_DICE);
  });

  test.each([
    ['another player', multi, ANTONIA.id],
    ['training', solo, LUKAS.id],
  ])(
    'a roll request the turn outran stops at once; the next roll still shakes (%s)',
    async (_, start, next) => {
      const { result, rerender } = await renderHook(
        ({ turn }: { turn: Turn }) => useDiceAnimation(turn),
        { initialProps: { turn: start.turn } },
      );
      await act(() => result.current.request());
      expect(result.current.rollPending).toBe(true);

      // The entry (e.g. the time running out) passes the turn before the roll is answered.
      const handed = scoreFullHouse(start);
      await rerender({ turn: handed.turn });
      expect(handed.turn.playerId).toBe(next);
      expect(result.current.rollPending).toBe(false);
      expect(result.current.rolling).toBe(false);

      const before = result.current.shakeKeys;
      await rerender({ turn: rollOf(handed.turn, [1, 1, 1, 4, 6]) });
      expect(result.current.rolling).toBe(true);
      expect(result.current.shakeKeys).toEqual(before.map((key) => key + 1));
      await act(() => jest.advanceTimersByTime(320));
      expect(result.current.rolling).toBe(false);
      expect(result.current.shownDice).toEqual([1, 1, 1, 4, 6]);
    },
  );
});

const mount = (snap: SessionSnapshot) => renderLiveSession(<GameScreen />, snap);

describe('the game screen after "Eintragen"', () => {
  async function confirmFullHouse(session: ReturnType<typeof fakeSession>) {
    await fireEvent.press(screen.getByLabelText('Full House: 25 Punkte eintragen'));
    await fireEvent.press(screen.getByRole('button', { name: 'Eintragen' }));
    expect(session.score).toHaveBeenCalledWith(Category.FullHouse, 0);
    // Still sending: the confirm bar stays until the entry arrives.
    expect(screen.getByRole('button', { name: 'Eintragen' })).toBeTruthy();
  }

  test('the scorer sees the next player’s turn as soon as the entry arrives', async () => {
    const { session, update } = await mount(snapshot({ game: multi }));
    await confirmFullHouse(session);

    await update(snapshot({ game: scoreFullHouse(multi) }));
    expect(screen.queryByRole('button', { name: 'Eintragen' })).toBeNull();
    expect(screen.getByText('Antonia ist dran')).toBeTruthy();
    // Antonia's sheet, not mine with the new entry on it.
    expect(screen.queryByLabelText('Full House: 25 Punkte, eingetragen')).toBeNull();
    expect(screen.getByLabelText('Full House, noch offen')).toBeTruthy();
  });

  test('the other phones switch to the next turn right away', async () => {
    const watching = { myId: ANTONIA.id, role: Role.Guest };
    const { update } = await mount(snapshot({ game: multi, ...watching }));
    expect(screen.getByLabelText('Full House: 25 Punkte möglich')).toBeTruthy();

    await update(snapshot({ game: scoreFullHouse(multi), ...watching }));
    expect(screen.getByRole('button', { name: 'Würfeln' })).toBeEnabled();
    // My own, still empty sheet: no previews of Lukas' roll, not his new entry.
    expect(screen.getByLabelText('Full House, noch offen')).toBeTruthy();
    expect(screen.queryByLabelText(/möglich$/)).toBeNull();
  });

  test('in training the next own turn starts right away', async () => {
    const training = { role: Role.Training, players: [LUKAS] };
    const { session, update } = await mount(snapshot({ game: solo, ...training }));
    await confirmFullHouse(session);

    await update(snapshot({ game: scoreFullHouse(solo), ...training }));
    expect(screen.queryByRole('button', { name: 'Eintragen' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Würfeln' })).toBeEnabled();
    expect(screen.getByLabelText('Full House: 25 Punkte, eingetragen')).toBeTruthy();
    expect(screen.queryByLabelText(/Punkte eintragen$/)).toBeNull();
  });
});

describe('a selection when the time runs out', () => {
  const antoniaPlays = (state: GameState) =>
    play(withDice(state, [1, 2, 3, 4, 6]), {
      type: ActionType.Score,
      by: ANTONIA.id,
      category: Category.Chance,
      sheet: 0,
    });

  test.each([
    ['another player', multi, antoniaPlays, {}],
    ['training', solo, (state: GameState) => state, { role: Role.Training, players: [LUKAS] }],
  ])('the next own turn starts without it (%s)', async (_, start, untilMyTurn, mode) => {
    const { update } = await mount(snapshot({ game: start, ...mode }));
    await fireEvent.press(screen.getByLabelText('Fünfer: 15 Punkte eintragen'));
    expect(screen.getByRole('button', { name: 'Eintragen' })).toBeTruthy();

    // The automatic pick takes another field than the selected one.
    const timedOut = play(start, { type: ActionType.Timeout });
    expect(lastEntry(timedOut)).toMatchObject({
      kind: HistoryKind.AutoScored,
      category: Category.FullHouse,
    });
    await update(snapshot({ game: timedOut, ...mode }));
    expect(screen.queryByRole('button', { name: 'Eintragen' })).toBeNull();

    // My next turn: before any roll, then with the same dice and roll count as before.
    const myTurn = untilMyTurn(timedOut);
    expect(myTurn.turn.playerId).toBe(LUKAS.id);
    await update(snapshot({ game: myTurn, ...mode }));
    expect(screen.getByRole('button', { name: 'Würfeln' })).toBeEnabled();
    await update(snapshot({ game: withDice(myTurn, [2, 2, 5, 5, 5]), ...mode }));
    expect(screen.queryByRole('button', { name: 'Eintragen' })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Fünfer: 15 Punkte eintragen', selected: false }),
    ).toBeTruthy();
  });
});
