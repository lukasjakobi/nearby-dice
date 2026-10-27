import {
  ActionType,
  autoPick,
  faceCounts,
  gamePlayer,
  isYatzy,
  luckyNumberOf,
  rollsLeft,
} from '@/domain';
import type { GameState, Held, PlayerAction, PlayerId } from '@/domain';

/** Points at which a bot stops rolling and takes the field. */
const GOOD_ENOUGH = 25;

/**
 * Strategy for the bots in tests and scenarios: roll, keep the most
 * frequent face, roll again, then take the best field. Returns `null` when
 * it is not this bot's move.
 */
export function botMove(state: GameState, botId: PlayerId): PlayerAction | null {
  const { turn, rules } = state;
  if (state.finished || turn.playerId !== botId) return null;
  if (turn.rollsUsed === 0) return { type: ActionType.Roll, by: botId };

  const pick = autoPick(turn.dice, gamePlayer(state, botId)!.sheets, rules, luckyNumberOf(state));
  const satisfied = isYatzy(turn.dice) || (pick?.points ?? 0) >= GOOD_ENOUGH;
  if (rollsLeft(state) > 0 && !satisfied) {
    const held = holdMostFrequent(turn.dice);
    const alreadyHeld = held.every((h, i) => h === turn.held[i]);

    return alreadyHeld
      ? { type: ActionType.Roll, by: botId }
      : { type: ActionType.Hold, by: botId, held };
  }

  if (!pick) return null;

  return { type: ActionType.Score, by: botId, category: pick.category, sheet: pick.sheet };
}

function holdMostFrequent(dice: readonly number[]): Held {
  const counts = faceCounts(dice);
  let keep = 6;
  for (let face = 6; face >= 1; face--) if (counts[face] > counts[keep]) keep = face;

  return dice.map((die) => die === keep) as unknown as Held;
}
