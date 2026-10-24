import { ActionType, luckyNumberOf } from '@/domain/engine';
import { Category, Link, Ruleset } from '@/domain/enums';
import { DEFAULT_RULES, PRESETS, PresetId } from '@/domain/rules';
import type { GameState } from '@/domain/engine';
import type { Dice } from '@/domain/roll';
import { t } from '@/test/i18n';
import { ConnectionStatus, Role } from '@/session/types';
import {
  JONAS,
  LUKAS,
  ANTONIA,
  diceWithSum,
  game,
  play,
  snapshot,
  withDice,
} from '@/test/fixtures';

import { BannerKind, CellState, ControlKind, buildGameView } from '../view';
import type { CellView, GameView } from '../view';

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

const cell = (view: GameView, category: Category): CellView =>
  [...view.sheet.upper, ...view.sheet.lower].find((c) => c.category === category)!;

describe('before the first roll', () => {
  const view = buildGameView(t, snapshot({}), local())!;

  test('placeholder dice, "Würfeln", three roll bars', () => {
    expect(view.dice.every((d) => d.value === 0 && !d.canToggle)).toBe(true);
    expect(view.control).toMatchObject({
      kind: ControlKind.MyTurn,
      rollLabel: 'Würfeln',
      rollsLeft: 3,
      rollsTotal: 3,
      canRoll: true,
    });
    expect(view.control.kind === ControlKind.MyTurn && view.control.rollsText).toBe(
      '3 Würfe übrig',
    );
  });

  test('every cell is open, nothing pickable', () => {
    expect(view.sheet.upper.every((c) => c.state === CellState.Open && !c.pickable)).toBe(true);
    expect(view.sheet.title).toBe('Dein Blatt');
    expect(view.roundLabel).toBe('Runde 1 von 13');
  });
});

describe('after a roll on my turn', () => {
  const rolled = withDice(game([LUKAS, ANTONIA]), [3, 3, 3, 5, 5]);
  const view = buildGameView(t, snapshot({ game: rolled }), local([3, 3, 3, 5, 5]))!;

  test('previews with points; zero previews are red', () => {
    expect(cell(view, Category.FullHouse)).toMatchObject({
      state: CellState.Preview,
      value: '25',
      pickable: true,
    });
    expect(cell(view, Category.Threes)).toMatchObject({ state: CellState.Preview, value: '9' });
    expect(cell(view, Category.FourOfAKind)).toMatchObject({
      state: CellState.PreviewZero,
      value: '0',
    });
    expect(cell(view, Category.FullHouse).accessibilityLabel).toBe(
      'Full House: 25 Punkte eintragen',
    );
  });

  test('"Nochmal würfeln" and dice can be held', () => {
    expect(view.control).toMatchObject({ rollLabel: 'Nochmal würfeln', rollsLeft: 2 });
    expect(view.dice.every((d) => d.canToggle)).toBe(true);
  });

  test('while re-rolling, the last previews stay but cannot be picked', () => {
    const shaking = buildGameView(t, snapshot({ game: withDice(rolled, [1, 2, 3, 4, 6]) }), {
      ...local([3, 3, 3, 5, 5]),
      rolling: true,
    })!;
    expect(cell(shaking, Category.FullHouse)).toMatchObject({
      state: CellState.Preview,
      value: '25',
      pickable: false,
    });
  });

  test('no previews while the first roll is still shaking', () => {
    const shaking = buildGameView(t, snapshot({ game: rolled }), {
      ...local(),
      rolling: true,
    })!;
    expect(cell(shaking, Category.FullHouse).state).toBe(CellState.Open);
  });

  test('a written field is filled', () => {
    const written = play(rolled, {
      type: ActionType.Score,
      by: LUKAS.id,
      category: Category.Chance,
      sheet: 0,
    });
    const next = play(written, { type: ActionType.Skip, playerId: ANTONIA.id });
    const view2 = buildGameView(t, snapshot({ game: next }), local())!;
    expect(cell(view2, Category.Chance)).toMatchObject({ state: CellState.Filled, value: '19' });
  });
});

describe("another player's turn", () => {
  const players = [LUKAS, JONAS];
  const jonasTurn = withDice(
    play(game(players), { type: ActionType.Skip, playerId: LUKAS.id }),
    [1, 2, 3, 4, 5],
  );

  test('their sheet with previews that I cannot pick', () => {
    const view = buildGameView(t, snapshot({ players, game: jonasTurn }), local([1, 2, 3, 4, 5]))!;
    expect(view.sheet.title).toBe('Jonas’ Blatt');
    expect(cell(view, Category.LargeStraight)).toMatchObject({
      state: CellState.Preview,
      pickable: false,
    });
    expect(view.control).toEqual({
      kind: ControlKind.Waiting,
      text: 'Jonas ist dran',
      busy: true,
      rollsText: '2\u00a0Würfe übrig',
      rollsLabel: 'Jonas: 2\u00a0Würfe übrig',
      rollsLeft: 2,
      rollsTotal: 3,
    });
  });

  test('a lost player: host gets options, guests a waiting banner', () => {
    const lost = players.map((p) => (p.id === JONAS.id ? { ...p, link: Link.Lost } : p));
    const host = buildGameView(t, snapshot({ players: lost, game: jonasTurn }), local())!;
    expect(host.banner).toEqual({
      kind: BannerKind.PlayerLostHost,
      message: 'Jonas hat die Verbindung verloren',
    });
    expect(host.control).toMatchObject({
      kind: ControlKind.Waiting,
      text: 'Jonas ist nicht erreichbar',
      busy: false,
    });
    expect(host.pills.find((p) => p.id === JONAS.id)?.dimmed).toBe(true);

    const withAntonia = [...lost, ANTONIA];
    const guest = buildGameView(
      t,
      snapshot({ role: Role.Guest, myId: ANTONIA.id, players: withAntonia, game: jonasTurn }),
      local(),
    )!;
    expect(guest.banner).toEqual({
      kind: BannerKind.PlayerLostGuest,
      message: 'Warten auf Jonas …',
    });
  });
});

describe('connection and rules', () => {
  test('own connection lost: banner with attempt, card dimmed', () => {
    const view = buildGameView(
      t,
      snapshot({
        role: Role.Guest,
        myId: ANTONIA.id,
        connection: { status: ConnectionStatus.Reconnecting, attempt: 2 },
      }),
      local(),
    )!;
    expect(view.banner).toEqual({
      kind: BannerKind.OwnConnection,
      message: 'Verbindung unterbrochen · Versuch 2 von 3',
    });
    expect(view.cardDimmed).toBe(true);
  });

  test('top to bottom: only the next open field shows a preview', () => {
    const rules = PRESETS[PresetId.TopToBottom];
    const rolled = withDice(game([LUKAS, ANTONIA], rules), [6, 6, 6, 6, 6]);
    const view = buildGameView(t, snapshot({ game: rolled }), local([6, 6, 6, 6, 6]))!;
    const previews = [...view.sheet.upper, ...view.sheet.lower].filter(
      (c) => c.state !== CellState.Open,
    );
    expect(previews.map((c) => c.category)).toEqual([Category.Ones]);
  });

  test('yatzy straights spell out their fixed run', () => {
    const rules = PRESETS[PresetId.Yatzy];
    const rolled = withDice(game([LUKAS, ANTONIA], rules), [3, 4, 5, 6, 6]);
    const view = buildGameView(t, snapshot({ game: rolled }), local([3, 4, 5, 6, 6]))!;
    const small = cell(view, Category.SmallStraight);
    expect(small.hint).toBe('1-2-3-4-5');
    expect(small.accessibilityLabel).toMatch(/^Kleine Straße \(1-2-3-4-5\): 0/);
    expect(cell(view, Category.LargeStraight).hint).toBe('2-3-4-5-6');
    expect(cell(view, Category.Chance).hint).toBeNull();
  });

  test('classic straights have no hint', () => {
    const view = buildGameView(t, snapshot({}), local())!;
    expect(cell(view, Category.SmallStraight).hint).toBeNull();
  });

  test('three sheets get ×1 ×2 ×3 tabs', () => {
    const rules = PRESETS[PresetId.Triple];
    const view = buildGameView(t, snapshot({ game: game([LUKAS, ANTONIA], rules) }), local())!;
    expect(view.sheet.tabs).toEqual(['×1', '×2', '×3']);
    expect(view.roundLabel).toBe('Runde 1 von 39');
  });
});

describe('while the dice are in the air', () => {
  const rolled = withDice(game([LUKAS, ANTONIA]), [2, 2, 5, 5, 5]);

  test('the roll button is busy, not disabled, and holds cannot change', () => {
    const view = buildGameView(t, snapshot({ game: rolled }), {
      ...local([2, 2, 5, 5, 5]),
      rollPending: true,
    })!;
    expect(view.control).toMatchObject({ canRoll: false, rollBusy: true });
    expect(view.dice.every((d) => !d.canToggle)).toBe(true);
  });

  test('with no rolls left the button is plainly unavailable', () => {
    const used = { ...rolled, turn: { ...rolled.turn, rollsUsed: 3 } };
    const view = buildGameView(t, snapshot({ game: used }), local([2, 2, 5, 5, 5]))!;
    expect(view.control).toMatchObject({ canRoll: false, rollBusy: false });
  });
});

describe('with a field selected', () => {
  const rolled = withDice(game([LUKAS, ANTONIA]), [2, 2, 5, 5, 5]);

  test('the dice are locked in: no holding, nothing to re-roll', () => {
    const view = buildGameView(t, snapshot({ game: rolled }), {
      ...local([2, 2, 5, 5, 5]),
      selectedCategory: Category.FullHouse,
    })!;
    expect(view.dice.every((d) => d.locked && !d.canToggle)).toBe(true);
  });

  test('a selection that is no longer pickable locks nothing', () => {
    const view = buildGameView(t, snapshot({ game: rolled }), {
      ...local([2, 2, 5, 5, 5]),
      selectedCategory: Category.FullHouse,
      rolling: true,
    })!;
    expect(view.dice.some((d) => d.locked)).toBe(false);
  });
});

describe("another player's selection", () => {
  const rolled = withDice(game([LUKAS, ANTONIA]), [2, 2, 5, 5, 5]);
  const focused = {
    ...rolled,
    turn: { ...rolled.turn, focus: { category: Category.FullHouse, sheet: 0 } },
  };
  const onAntoniasPhone = (state: GameState = focused) =>
    buildGameView(
      t,
      snapshot({ role: Role.Guest, myId: ANTONIA.id, game: state }),
      local([2, 2, 5, 5, 5]),
    )!;

  test('shows on my phone before it is entered, with the dice locked in', () => {
    const view = onAntoniasPhone();
    expect(view.sheet.focused).toBe(Category.FullHouse);
    expect(cell(view, Category.FullHouse).pickable).toBe(false);
    expect(view.dice.every((d) => d.locked && !d.canToggle)).toBe(true);
    expect(view.control).toMatchObject({ text: 'Lukas wählt Full House …' });
  });

  test('brings its sheet into view', () => {
    const rules = PRESETS[PresetId.Triple];
    const triple = withDice(game([LUKAS, ANTONIA], rules), [2, 2, 5, 5, 5]);
    const state = {
      ...triple,
      turn: { ...triple.turn, focus: { category: Category.FullHouse, sheet: 2 } },
    };
    const view = buildGameView(
      t,
      snapshot({ role: Role.Guest, myId: ANTONIA.id, game: state }),
      local([2, 2, 5, 5, 5]),
    )!;
    expect(view.sheet).toMatchObject({ selectedTab: 2, focused: Category.FullHouse });
  });

  test('nothing shows without one', () => {
    const view = onAntoniasPhone(rolled);
    expect(view.sheet.focused).toBeNull();
    expect(view.dice.some((d) => d.locked)).toBe(false);
    expect(view.control).toMatchObject({ text: 'Lukas ist dran' });
  });
});

describe('upper bonus', () => {
  test('shown with its progress by default', () => {
    const view = buildGameView(t, snapshot({}), local())!;
    expect(view.sheet.bonus).toMatchObject({ label: 'Bonus (+35)', progress: '0 / 63' });
  });

  test('gone when the rules switch it off', () => {
    const rules = { ...DEFAULT_RULES, upperBonus: false };
    const view = buildGameView(t, snapshot({ game: game([LUKAS, ANTONIA], rules) }), local())!;
    expect(view.sheet.bonus).toBeNull();
  });
});

describe('new variants', () => {
  test.each([
    [Category.Even, [5, 1, 6, 6, 2], 14],
    [Category.Odd, [5, 1, 6, 6, 2], 6],
    [Category.Mini, [5, 1, 6, 6, 2], 0],
    [Category.Mini, [1, 1, 1, 1, 1], 30],
    [Category.Mini, [1, 1, 1, 1, 5], 30],
    [Category.Mini, [1, 1, 1, 1, 6], 30],
    [Category.Mini, [2, 2, 2, 2, 3], 0],
  ])('XL %s with %j previews and records %i points', (category, dice, points) => {
    const rules = PRESETS[PresetId.ClassicXl];
    const rolled = withDice(game([LUKAS, ANTONIA], rules), dice);
    const preview = buildGameView(t, snapshot({ game: rolled }), local(dice))!;
    expect(cell(preview, category)).toMatchObject({
      state: points === 0 ? CellState.PreviewZero : CellState.Preview,
      value: String(points),
      pickable: true,
    });

    const written = play(
      rolled,
      { type: ActionType.Score, by: LUKAS.id, category, sheet: 0 },
      { type: ActionType.Skip, playerId: ANTONIA.id },
    );
    const filled = buildGameView(t, snapshot({ game: written }), local())!;
    expect(cell(filled, category)).toMatchObject({
      state: CellState.Filled,
      value: String(points),
      pickable: false,
    });
    expect(written.history[0]).toMatchObject({ category, dice, points });
  });

  test('XL shows 17 fields, their hints, and the classic upper bonus', () => {
    const rules = PRESETS[PresetId.ClassicXl];
    const view = buildGameView(t, snapshot({ game: game([LUKAS, ANTONIA], rules) }), local())!;
    expect([...view.sheet.upper, ...view.sheet.lower]).toHaveLength(17);
    expect(view.sheet.lower.map((field) => field.category)).toEqual([
      Category.TwoPairs,
      Category.Even,
      Category.Odd,
      Category.Mini,
      Category.ThreeOfAKind,
      Category.FourOfAKind,
      Category.FullHouse,
      Category.SmallStraight,
      Category.LargeStraight,
      Category.Yatzy,
      Category.Chance,
    ]);
    expect([Category.Even, Category.Odd, Category.Mini].map((c) => cell(view, c).hint)).toEqual([
      '2·4·6',
      '1·3·5',
      '≤\u00A010',
    ]);

    expect(view.roundLabel).toBe(t('game.round', { n: 1, total: 17 }));
    expect(view.sheet.bonus?.label).toBe(t('game.bonus', { points: 35 }));
  });

  test.each(Object.values(Ruleset))(
    '%s shows the target before rolling only with the rule on',
    (ruleset) => {
      for (const luckyNumber of [false, true]) {
        const rules = { ...DEFAULT_RULES, ruleset, luckyNumber };
        const state = game([LUKAS, ANTONIA], rules);
        const view = buildGameView(t, snapshot({ game: state }), local())!;
        if (luckyNumber) {
          expect(view.sheet.lower.at(-1)).toMatchObject({
            category: Category.LuckyNumber,
            state: CellState.Open,
            hint: t('game.luckyNumberHint', { n: luckyNumberOf(state)! }),
          });
        } else {
          expect(view.sheet.lower.some((field) => field.category === Category.LuckyNumber)).toBe(
            false,
          );
        }
      }
    },
  );

  test.each([0, 1])('lucky-number preview and filled value agree (sum offset %i)', (offset) => {
    const rules = PRESETS[PresetId.LuckyNumber];
    const initial = game([LUKAS, ANTONIA], rules);
    const dice = [...diceWithSum(luckyNumberOf(initial)! + offset)];
    const rolled = withDice(initial, dice);
    const preview = buildGameView(t, snapshot({ game: rolled }), local(dice))!;
    expect(cell(preview, Category.LuckyNumber)).toMatchObject({
      hint: t('game.luckyNumberHint', { n: luckyNumberOf(initial)! }),
      state: offset === 0 ? CellState.Preview : CellState.PreviewZero,
      value: offset === 0 ? '40' : '0',
      pickable: true,
    });
    const written = play(
      rolled,
      {
        type: ActionType.Score,
        by: LUKAS.id,
        category: Category.LuckyNumber,
        sheet: 0,
      },
      { type: ActionType.Skip, playerId: ANTONIA.id },
    );
    const filled = buildGameView(t, snapshot({ game: written }), local())!;
    expect(cell(filled, Category.LuckyNumber)).toMatchObject({
      state: CellState.Filled,
      value: offset === 0 ? '40' : '0',
      hint: null,
      accessibilityLabel: t('game.cell.filled', {
        label: t(`labels.category.${Category.LuckyNumber}`),
        count: offset === 0 ? 40 : 0,
      }),
    });
  });
});

describe('lost player', () => {
  // Lukas (me, host) skips, then Jonas skips: it is Antonia's turn.
  const antoniaTurn = play(
    game([LUKAS, JONAS, ANTONIA]),
    { type: ActionType.Skip, playerId: LUKAS.id },
    { type: ActionType.Skip, playerId: JONAS.id },
  );
  const lostLinks = (ids: string[]) =>
    [LUKAS, JONAS, ANTONIA].map((p) => (ids.includes(p.id) ? { ...p, link: Link.Lost } : p));

  test('prefers the player whose turn it is, who can be skipped', () => {
    expect(antoniaTurn.turn.playerId).toBe(ANTONIA.id);
    const view = buildGameView(
      t,
      snapshot({ players: lostLinks([JONAS.id, ANTONIA.id]), game: antoniaTurn }),
      local(),
    )!;
    expect(view.lostPlayer).toEqual({ id: ANTONIA.id, name: 'Antonia', canSkip: true });
  });

  test('a lost player who is not on turn cannot be skipped', () => {
    const view = buildGameView(
      t,
      snapshot({ players: lostLinks([JONAS.id]), game: game([LUKAS, JONAS, ANTONIA]) }),
      local(),
    )!;
    expect(view.lostPlayer).toEqual({ id: JONAS.id, name: 'Jonas', canSkip: false });
  });
});
