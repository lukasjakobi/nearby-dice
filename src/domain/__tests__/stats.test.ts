import { JONAS, LUKAS, ANTONIA, savedGame } from '@/test/fixtures';

import { gamePlayer, ranking } from '../engine';
import { PresetId } from '../rules';
import { yatzyCount } from '../scoring';
import { EMPTY_STATS, recordGame, recordTraining } from '../stats';
import type { SavedGame } from '../stats';

const saved = (id: string, overrides: Partial<SavedGame> = {}) =>
  savedGame([LUKAS, ANTONIA, JONAS], ANTONIA, { id, ...overrides });
const PLAYED = saved('played').game;
const MINE = ranking(PLAYED).find((placement) => placement.playerId === ANTONIA.id)!;

test('a finished game is saved whole and counted once towards its mode', () => {
  const once = recordGame(EMPTY_STATS, saved('session-1'));

  expect(recordGame(once, saved('session-1'))).toBe(once);
  expect(once.recent).toEqual([saved('session-1')]);
  expect(once.recent[0]!.game.history.length).toBeGreaterThan(0);
  expect(once.modes).toEqual({
    [PresetId.Classic]: {
      wins: MINE.winner ? 1 : 0,
      best: MINE.total,
      yatzys: yatzyCount(gamePlayer(PLAYED, ANTONIA.id)!.sheets),
    },
  });
});

test('the eleventh game drops the oldest one, while the totals keep counting', () => {
  let stats = EMPTY_STATS;
  for (let i = 1; i <= 11; i++) stats = recordGame(stats, saved(`session-${i}`));

  expect(stats.recent).toHaveLength(10);
  expect(stats.recent[0]!.id).toBe('session-11');
  expect(stats.recent.map(({ id }) => id)).not.toContain('session-1');
  expect(stats.modes[PresetId.Classic]!.wins).toBe(MINE.winner ? 11 : 0);
});

test('a game this phone was removed from is not saved', () => {
  const removed = {
    ...PLAYED,
    players: PLAYED.players.map((player) =>
      player.id === ANTONIA.id ? { ...player, removed: true } : player,
    ),
  };

  expect(recordGame(EMPTY_STATS, saved('session-1', { game: removed }))).toBe(EMPTY_STATS);
});

test('a game with rules no preset uses is not saved', () => {
  const custom = saved('session-1', {
    game: { ...PLAYED, rules: { ...PLAYED.rules, rollsPerTurn: 4 } },
  });

  expect(recordGame(EMPTY_STATS, custom)).toBe(EMPTY_STATS);
});

test('the Training best only rises and leaves the multiplayer stats alone', () => {
  const best = recordTraining(EMPTY_STATS, { id: 'training-1', points: 24 });

  expect(best).toEqual({ ...EMPTY_STATS, trainingBest: 24, trainingBestId: 'training-1' });
  expect(recordTraining(best, { id: 'training-2', points: 24 })).toBe(best);
  expect(recordTraining(best, { id: 'training-3', points: 30 }).trainingBestId).toBe('training-3');
});
