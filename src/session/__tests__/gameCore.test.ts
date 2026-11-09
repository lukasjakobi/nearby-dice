import { ActionType } from '@/domain/engine';
import { PlayerColor } from '@/domain/player';
import { seededRng } from '@/domain/random';
import { PresetId } from '@/domain/rules';

import { GameCore, MoveOutcome } from '../gameCore';
import { RematchVote, Role, SessionPhase } from '../types';

jest.useFakeTimers();

function core(publish = jest.fn()) {
  const game = new GameCore({
    role: Role.Host,
    profile: { name: 'Lukas', color: PlayerColor.Amber },
    settings: {
      code: 'ABCD',
      roundName: '',
      preset: PresetId.Blitz,
      maxPlayers: 6,
      allowRejoin: true,
    },
    rng: seededRng(7),
    publish,
    onFinish: ({ players }) => ({
      rematch: Object.fromEntries(players.map((p) => [p.id, RematchVote.Pending])),
    }),
  });

  return { game, publish };
}

test('publishes the commits of one batch once', () => {
  const { game, publish } = core();

  game.batch(() => {
    game.commit({ roundName: 'a' });
    game.batch(() => game.commit({ roundName: 'b' }));
  });

  expect(publish).toHaveBeenCalledTimes(1);
  expect(game.shared.roundName).toBe('b');
  expect(game.shared.rev).toBe(3);
});

test('publishes every commit outside a batch, and nothing for an empty batch', () => {
  const { game, publish } = core();

  game.batch(() => {});
  game.commit({ roundName: 'a' });

  expect(publish).toHaveBeenCalledTimes(1);
});

test('ignores moves until the countdown ends, then reports rejected ones', () => {
  const { game } = core();
  game.beginGame(game.shared.players, 1000);
  const roll = { type: ActionType.Roll, by: game.myId } as const;

  expect(game.act(roll)).toBe(MoveOutcome.Ignored);
  jest.advanceTimersByTime(1000);
  expect(game.shared.phase).toBe(SessionPhase.Playing);
  expect(game.act({ type: ActionType.Roll, by: 'someone-else' })).toBe(MoveOutcome.Rejected);
  expect(game.act(roll)).toBe(MoveOutcome.Applied);
  expect(game.toggleHold(game.myId, 2)).toBe(MoveOutcome.Applied);
  expect(game.shared.game!.turn.held[2]).toBe(true);
});

test('stops taking moves once disposed', () => {
  const { game } = core();
  game.beginGame(game.shared.players, 0);
  jest.advanceTimersByTime(0);

  game.dispose();

  expect(game.act({ type: ActionType.Roll, by: game.myId })).toBe(MoveOutcome.Ignored);
});
