/**
 * Messages between host and guests: versioned JSON, validated on arrival.
 * The host broadcasts the whole `SharedSession` (`State`) after every change,
 * so every phone always holds the complete game, including the history.
 */
import type { Focus, Held, Profile } from '@/domain';
import { Category, isFiniteTimestamp, isFocus, isInteger, isString } from '@/domain';

import { RematchVote } from './types';
import type { SharedSession } from './types';
import { isProfile, isSharedSession } from './protocolValidation';

/**
 * 2: the session shares its preset instead of free-form rules. 3: renamed ruleset and category values.
 * 4: removed the rule options no preset used (`Joker.Free`, the 100 Yatzy bonus,
 *    `fullHouseFromFiveOfAKind`).
 */
export const PROTOCOL_VERSION = 4;

export enum MessageType {
  /** guest → host: join or rejoin. */
  Hello = 'hello',
  /** host → guest: you are in; here is your seat and the session. */
  Welcome = 'welcome',
  /** host → guest: you cannot join. */
  Reject = 'reject',
  /** host → all: the session changed. */
  State = 'state',
  /** host → guest: you were removed. */
  Kick = 'kick',
  /** host → all: the session is over. */
  Close = 'close',
  /** guest → host: intents. */
  Roll = 'roll',
  Hold = 'hold',
  Score = 'score',
  /** The selected field, before "Eintragen". */
  Focus = 'focus',
  /** The sheet the player whose turn it is has open. */
  ViewSheet = 'view-sheet',
  Vote = 'vote',
  Leave = 'leave',
  /** both ways: liveness. */
  Ping = 'ping',
  Pong = 'pong',
}

export enum RejectReason {
  Full = 'full',
  Removed = 'removed',
  Started = 'started',
}

export enum CloseReason {
  LobbyClosed = 'lobby-closed',
  GameEnded = 'game-ended',
}

export type Message =
  | {
      type: MessageType.Hello;
      deviceId: string;
      profile: Profile;
      authToken: string;
      rejoinToken: string | null;
    }
  | { type: MessageType.Welcome; playerId: string; rejoinToken: string; shared: SharedSession }
  | { type: MessageType.Reject; reason: RejectReason }
  | { type: MessageType.State; shared: SharedSession }
  | { type: MessageType.Kick }
  | { type: MessageType.Close; reason: CloseReason }
  | { type: MessageType.Roll }
  | { type: MessageType.Hold; held: Held }
  | { type: MessageType.Score; category: Category; sheet: number }
  | { type: MessageType.Focus; focus: Focus | null }
  | { type: MessageType.ViewSheet; sheet: number }
  | { type: MessageType.Vote; vote: RematchVote }
  | { type: MessageType.Leave }
  | { type: MessageType.Ping; at: number }
  | { type: MessageType.Pong; at: number };

export type MessageOf<T extends MessageType> = Extract<Message, { type: T }>;

/** Fields every message of a type must carry. */
const REQUIRED: Record<MessageType, readonly string[]> = {
  [MessageType.Hello]: ['deviceId', 'profile', 'authToken'],
  [MessageType.Welcome]: ['playerId', 'rejoinToken', 'shared'],
  [MessageType.Reject]: ['reason'],
  [MessageType.State]: ['shared'],
  [MessageType.Kick]: [],
  [MessageType.Close]: ['reason'],
  [MessageType.Roll]: [],
  [MessageType.Hold]: ['held'],
  [MessageType.Score]: ['category', 'sheet'],
  [MessageType.Focus]: ['focus'],
  [MessageType.ViewSheet]: ['sheet'],
  [MessageType.Vote]: ['vote'],
  [MessageType.Leave]: [],
  [MessageType.Ping]: ['at'],
  [MessageType.Pong]: ['at'],
};

const MESSAGE_TYPES = new Set<string>(Object.values(MessageType));

export function encode(message: Message): string {
  return JSON.stringify({ v: PROTOCOL_VERSION, ...message });
}

/** Returns `null` for other versions, unknown types and missing fields. */
export function decode(data: string): Message | null {
  if (typeof data !== 'string' || data.length > 512_000) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) return null;
  const { v, type, ...rest } = parsed as Record<string, unknown>;
  if (v !== PROTOCOL_VERSION || typeof type !== 'string' || !MESSAGE_TYPES.has(type)) return null;
  const required = REQUIRED[type as MessageType];
  if (!required.every((key) => rest[key] !== undefined)) return null;
  if (!validMessage(type as MessageType, rest)) return null;

  return { type, ...rest } as Message;
}

function validMessage(type: MessageType, value: Record<string, unknown>): boolean {
  switch (type) {
    case MessageType.Hello:
      return (
        isString(value.deviceId, 128) &&
        isProfile(value.profile) &&
        isString(value.authToken, 256) &&
        (value.rejoinToken === null ||
          value.rejoinToken === undefined ||
          isString(value.rejoinToken, 256))
      );
    case MessageType.Welcome:
      return (
        isString(value.playerId) &&
        isString(value.rejoinToken, 256) &&
        isSharedSession(value.shared) &&
        (value.shared as SharedSession).players.some((player) => player.id === value.playerId)
      );
    case MessageType.State:
      return isSharedSession(value.shared);
    case MessageType.Reject:
      return Object.values(RejectReason).includes(value.reason as RejectReason);
    case MessageType.Close:
      return Object.values(CloseReason).includes(value.reason as CloseReason);
    case MessageType.Hold:
      return (
        Array.isArray(value.held) &&
        value.held.length === 5 &&
        value.held.every((die) => typeof die === 'boolean')
      );
    case MessageType.Score:
      return (
        Object.values(Category).includes(value.category as Category) && isInteger(value.sheet, 0, 2)
      );
    case MessageType.Focus:
      return isFocus(value.focus);
    case MessageType.ViewSheet:
      return isInteger(value.sheet, 0, 2);
    case MessageType.Vote:
      return Object.values(RematchVote).includes(value.vote as RematchVote);
    case MessageType.Ping:
    case MessageType.Pong:
      return isFiniteTimestamp(value.at);
    case MessageType.Kick:
    case MessageType.Roll:
    case MessageType.Leave:
      return true;
  }
}
