import type { Category, Focus, GameState, Link, PlayerColor, PlayerId, PresetId } from '@/domain';
import type { Unsubscribe } from '@/lib';

export enum Role {
  Host = 'host',
  Guest = 'guest',
  /** "Training": one player on this phone, no other devices. */
  Training = 'training',
}

export enum SessionPhase {
  Lobby = 'lobby',
  Countdown = 'countdown',
  Playing = 'playing',
  Finished = 'finished',
}

/** This phone's link to the host. Always `Connected` on the host itself. */
export enum ConnectionStatus {
  Connected = 'connected',
  Reconnecting = 'reconnecting',
  Failed = 'failed',
}

/** Why this phone's session is over. */
export enum EndReason {
  Kicked = 'kicked',
  LobbyClosed = 'lobby-closed',
  GameEnded = 'game-ended',
  Left = 'left',
}

export enum RematchVote {
  Pending = 'pending',
  Yes = 'yes',
  No = 'no',
}

/** The three steps the guest sees while joining. */
export enum JoinStep {
  Search = 'search',
  Secure = 'secure',
  Join = 'join',
}

export enum JoinError {
  NotFound = 'not-found',
  Full = 'full',
  Removed = 'removed',
  Started = 'started',
  BluetoothOff = 'bluetooth-off',
  LocationOff = 'location-off',
  Denied = 'denied',
}

/** Why the host could not open a lobby. */
export enum HostError {
  BluetoothOff = 'bluetooth-off',
  LocationOff = 'location-off',
  PermissionMissing = 'permission-missing',
}

export type PlayerInfo = {
  id: PlayerId;
  name: string;
  color: PlayerColor;
  isHost: boolean;
  link: Link;
};

/** Everything the host shares. Every phone holds an identical copy, including the full game. */
export type SharedSession = {
  sessionId: string;
  code: string;
  roundName: string;
  /** The game mode for the next game; the running or finished game keeps its own rules. */
  preset: PresetId;
  maxPlayers: number;
  allowRejoin: boolean;
  phase: SessionPhase;
  /** Lobby order. */
  players: PlayerInfo[];
  /** The full game: every sheet, the turn and the whole history. */
  game: GameState | null;
  /** 1 for the first game, 2+ for rematches. */
  gameNumber: number;
  rematch: Partial<Record<PlayerId, RematchVote>>;
  /** Host clock. */
  countdownEndsAt: number | null;
  /** Host clock when this copy was sent; lets guests convert host timestamps. */
  hostTime: number;
  /** Increments with every change. */
  rev: number;
};

/** "The round as this phone sees it": what every screen renders. */
export type SessionSnapshot = {
  role: Role;
  myId: PlayerId;
  shared: SharedSession;
  connection: { status: ConnectionStatus; attempt: number };
  ended: EndReason | null;
  /** Local time minus host time. Add it to host timestamps to get local timestamps. */
  clockOffset: number;
};

/** What the screens can do in any session. */
export interface SessionController {
  readonly role: Role;
  getSnapshot(): SessionSnapshot;
  subscribe(listener: () => void): Unsubscribe;
  roll(): void;
  toggleHold(die: number): void;
  score(category: Category, sheet: number): void;
  /** Shows the selected field (or none) on every phone before it is entered. */
  focus(focus: Focus | null): void;
  /** Shows which sheet I have open on every phone; only on my turn. */
  viewSheet(sheet: number): void;
  voteRematch(vote: RematchVote): void;
  /** Leave for yourself. For the host this ends the session for everyone. */
  leave(): void;
  /** Stops timers and listeners; the session object is unusable afterwards. */
  dispose(): void;
}

export interface HostController extends SessionController {
  readonly role: Role.Host;
  start(): void;
  kick(playerId: PlayerId): void;
  closeLobby(): void;
  skipTurn(playerId: PlayerId): void;
  removeFromGame(playerId: PlayerId): void;
  startRematch(): void;
  /** In the lobby and on the results screen; a switch there undoes the guests' yes votes. */
  setPreset(preset: PresetId): void;
  endForAll(): void;
}

export interface GuestController extends SessionController {
  readonly role: Role.Guest;
  /** Lets this phone rejoin the same seat after a disconnect. */
  readonly rejoinToken: string;
  reconnect(): void;
}

/** A single-player game that never touches the network. */
export interface TrainingController extends SessionController {
  readonly role: Role.Training;
  /** Starts a new game in the current mode. */
  restart(): void;
  /** On the results screen, for the next game. */
  setPreset(preset: PresetId): void;
}

export type AnySession = HostController | GuestController | TrainingController;
