import {
  isBoolean,
  isFiniteTimestamp,
  isGameState,
  isInteger,
  isOneOf,
  isRecord,
  isString,
  Link,
  matchPreset,
  MAX_PLAYERS,
  MIN_PLAYERS,
  NAME_MAX_LENGTH,
  PlayerColor,
  PresetId,
  ROUND_NAME_MAX_LENGTH,
} from '@/domain';
import { isValidRoundCode } from '@/net';

import { RematchVote, SessionPhase } from './types';

const values = <T extends Record<string, string>>(value: T): string[] => Object.values(value);
const colors = values(PlayerColor);
const links = values(Link);
const phases = values(SessionPhase);
const votes = values(RematchVote);
const presets = values(PresetId);

export function isProfile(value: unknown): boolean {
  return isRecord(value) && isString(value.name, NAME_MAX_LENGTH) && isOneOf(value.color, colors);
}

function isPlayerInfo(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name, NAME_MAX_LENGTH) &&
    isOneOf(value.color, colors) &&
    isBoolean(value.isHost) &&
    isOneOf(value.link, links)
  );
}

/**
 * Every game is played with a preset's rules. Until it is finished, that is the session's
 * preset; afterwards the host may already have picked another one for the rematch.
 */
function isGame(value: unknown, preset: unknown, phase: unknown): boolean {
  if (!isGameState(value)) return false;
  const gamePreset = matchPreset(value.rules);

  return gamePreset !== null && (phase === SessionPhase.Finished || gamePreset === preset);
}

export function isSharedSession(value: unknown): boolean {
  if (
    !isRecord(value) ||
    !isString(value.sessionId) ||
    !isString(value.code, 4, 4) ||
    !isValidRoundCode(value.code as string) ||
    !isString(value.roundName, ROUND_NAME_MAX_LENGTH, 1) ||
    !isOneOf(value.preset, presets) ||
    !isInteger(value.maxPlayers, MIN_PLAYERS, MAX_PLAYERS) ||
    !isBoolean(value.allowRejoin) ||
    !isOneOf(value.phase, phases) ||
    !Array.isArray(value.players) ||
    value.players.length < 1 ||
    value.players.length > value.maxPlayers ||
    !value.players.every(isPlayerInfo) ||
    !isInteger(value.gameNumber, 0) ||
    !isRecord(value.rematch) ||
    !Object.entries(value.rematch).every(([id, vote]) => isString(id) && isOneOf(vote, votes)) ||
    !(value.countdownEndsAt === null || isFiniteTimestamp(value.countdownEndsAt)) ||
    !isFiniteTimestamp(value.hostTime) ||
    !isInteger(value.rev, 0) ||
    !(value.game === null || isGame(value.game, value.preset, value.phase))
  )
    return false;
  const players = value.players as Record<string, unknown>[];
  const rematch = value.rematch as Record<string, unknown>;
  const game = value.game;
  const ids = players.map((player) => player.id as string);

  return (
    new Set(ids).size === ids.length &&
    Object.keys(rematch).every((id) => ids.includes(id)) &&
    players.filter((player) => player.isHost === true).length === 1 &&
    (game === null ||
      sameStringSets(
        ids,
        ((game as Record<string, unknown>).players as Record<string, unknown>[]).map(
          (player) => player.id as string,
        ),
      )) &&
    ((value.phase === SessionPhase.Lobby && value.gameNumber === 0 && game === null) ||
      (value.phase === SessionPhase.Countdown &&
        value.gameNumber >= 1 &&
        game !== null &&
        !(game as Record<string, unknown>).finished) ||
      (value.phase === SessionPhase.Playing &&
        value.gameNumber >= 1 &&
        game !== null &&
        !(game as Record<string, unknown>).finished) ||
      (value.phase === SessionPhase.Finished &&
        value.gameNumber >= 1 &&
        game !== null &&
        (game as Record<string, unknown>).finished === true))
  );
}

function sameStringSets(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value));
}
