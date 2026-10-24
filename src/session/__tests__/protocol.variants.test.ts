import { Category } from '@/domain/enums';
import { PRESETS, PresetId } from '@/domain/rules';
import {
  ActionType,
  LUKAS,
  ANTONIA,
  finishedGame,
  play,
  presetGame,
  snapshot,
  withDice,
} from '@/test/fixtures';

import { decode, encode, MessageType, PROTOCOL_VERSION } from '../protocol';
import { SessionPhase } from '../types';

function sharedGame(preset: PresetId, category?: Category) {
  const initial = presetGame([LUKAS, ANTONIA], preset);
  const state = category
    ? play(withDice(initial, [1, 2, 3, 5, 6]), {
        type: ActionType.Score,
        by: LUKAS.id,
        category,
        sheet: 0,
      })
    : initial;

  return snapshot({ game: state, shared: { preset } }).shared;
}

describe.each([
  {
    preset: PresetId.ClassicXl,
    categories: [Category.TwoPairs, Category.Even, Category.Odd, Category.Mini],
  },
  { preset: PresetId.LuckyNumber, categories: [Category.LuckyNumber] },
  { preset: PresetId.Yatzy, categories: [Category.OnePair, Category.TwoPairs] },
])('$preset protocol', ({ preset, categories }) => {
  test.each(categories)('accepts sheets and history containing %s', (category) => {
    const shared = sharedGame(preset, category);
    expect(shared.game!.history).toHaveLength(1);
    expect(shared.game!.history[0]).toMatchObject({ category });
    const state = { type: MessageType.State, shared } as const;
    expect(decode(encode(state))).toEqual(state);
    const welcome = {
      type: MessageType.Welcome,
      playerId: ANTONIA.id,
      rejoinToken: 'token',
      shared,
    } as const;
    expect(decode(encode(welcome))).toEqual(welcome);
  });
});

test('accepts extra Yatzy bonuses in XL sheets', () => {
  const shared = sharedGame(PresetId.ClassicXl);
  shared.game!.players[0].sheets[0].extraYatzys = 1;
  expect(decode(encode({ type: MessageType.State, shared }))).not.toBeNull();
});

test('rejects messages from protocol version 1', () => {
  const shared = sharedGame(PresetId.Classic);
  expect(decode(JSON.stringify({ v: 1, type: MessageType.State, shared }))).toBeNull();
});

test.each([
  ['XL with lucky number', { ...PRESETS[PresetId.ClassicXl], luckyNumber: true }],
  ['Classic with two rolls', { ...PRESETS[PresetId.Classic], rollsPerTurn: 2 as const }],
])('rejects a game with rules no preset uses: %s', (_, rules) => {
  const shared = sharedGame(PresetId.Classic);
  const custom = { ...shared, game: { ...shared.game!, rules } };
  expect(decode(encode({ type: MessageType.State, shared: custom }))).toBeNull();
});

test('rejects a running game in another mode than the session', () => {
  const shared = { ...sharedGame(PresetId.Classic), preset: PresetId.Yatzy };
  expect(decode(encode({ type: MessageType.State, shared }))).toBeNull();
});

test('accepts a finished game while the next game has another mode', () => {
  const players = [LUKAS, ANTONIA];
  const shared = snapshot({
    players,
    phase: SessionPhase.Finished,
    game: finishedGame(players),
    shared: { preset: PresetId.Yatzy },
  }).shared;
  const state = { type: MessageType.State, shared } as const;
  expect(decode(encode(state))).toEqual(state);
});

test.each([null, 0, 1, 'true'])('rejects invalid luckyNumber=%j', (luckyNumber) => {
  const shared = sharedGame(PresetId.Classic);
  const game = { ...shared.game!, rules: { ...shared.game!.rules, luckyNumber } };
  expect(
    decode(
      JSON.stringify({ v: PROTOCOL_VERSION, type: MessageType.State, shared: { ...shared, game } }),
    ),
  ).toBeNull();
});

test('rejects a lucky-number sheet when the rule is off', () => {
  const shared = sharedGame(PresetId.Classic);
  shared.game!.players[0].sheets[0].fields[Category.LuckyNumber] = null;
  expect(decode(encode({ type: MessageType.State, shared }))).toBeNull();
});

test('rejects a sheet missing the enabled lucky-number field', () => {
  const shared = sharedGame(PresetId.LuckyNumber);
  delete shared.game!.players[0].sheets[0].fields[Category.LuckyNumber];
  expect(decode(encode({ type: MessageType.State, shared }))).toBeNull();
});

test.each([
  [PresetId.Classic, Category.TwoPairs],
  [PresetId.Classic, Category.LuckyNumber],
  [PresetId.ClassicXl, Category.OnePair],
  [PresetId.Yatzy, Category.Even],
])('rejects %s history containing disabled field %s', (preset, category) => {
  const shared = sharedGame(preset, Category.Chance);
  shared.game!.history = shared.game!.history.map((entry) => ({ ...entry, category }));
  expect(decode(encode({ type: MessageType.State, shared }))).toBeNull();
});
