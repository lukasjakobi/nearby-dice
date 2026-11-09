/**
 * The game loop that the host and training sessions share: the starting snapshot,
 * the countdown, every move through the engine, the turn timer and each commit.
 */
import { ActionType, createGame, Link, PRESETS, randomSeed, reduce, toggleHeld } from '@/domain';
import type { GameAction, PlayerId, Profile, Rng } from '@/domain';
import { randomId, secureRandomId, Store, Timers } from '@/lib';
import type { Unsubscribe } from '@/lib';

import { ConnectionStatus, SessionPhase } from './types';
import type { EndReason, PlayerInfo, Role, SessionSnapshot, SharedSession } from './types';

/** What became of a move handed to `GameCore.act`. */
export enum MoveOutcome {
  Applied = 'applied',
  /** The engine accepted it, but nothing changed, e.g. opening the page already open. */
  Unchanged = 'unchanged',
  /** The engine refused it, e.g. a roll out of turn. */
  Rejected = 'rejected',
  /** No game is being played. */
  Ignored = 'ignored',
}

/** The session settings the starting snapshot is made from. */
export type SessionSettings = Pick<
  SharedSession,
  'code' | 'roundName' | 'preset' | 'maxPlayers' | 'allowRejoin'
>;

export type GameCoreOptions = {
  role: Role;
  profile: Profile;
  settings: SessionSettings;
  rng?: Rng;
  /** Passes committed state on, once per batch of commits. */
  publish?: () => void;
  /** Fields that change together with the finished game, such as rematch votes. */
  onFinish?: (shared: SharedSession) => Partial<SharedSession>;
};

export class GameCore {
  private readonly rng: Rng;
  private readonly store: Store<SessionSnapshot>;
  private readonly timers = new Timers();
  private cancelTurnTimer: (() => void) | null = null;
  private batchDepth = 0;
  private unpublished = false;
  private disposed = false;

  constructor(private readonly options: GameCoreOptions) {
    this.rng = options.rng ?? Math.random;
    const me: PlayerInfo = {
      id: randomId(),
      name: options.profile.name,
      color: options.profile.color,
      isHost: true,
      link: Link.Connected,
    };
    this.store = new Store<SessionSnapshot>({
      role: options.role,
      myId: me.id,
      connection: { status: ConnectionStatus.Connected, attempt: 0 },
      ended: null,
      clockOffset: 0,
      shared: {
        ...options.settings,
        sessionId: secureRandomId(),
        phase: SessionPhase.Lobby,
        players: [me],
        game: null,
        gameNumber: 0,
        rematch: {},
        countdownEndsAt: null,
        hostTime: Date.now(),
        rev: 1,
      },
    });
  }

  // ── Reading ──────────────────────────────────────────────────────────────

  getSnapshot = (): SessionSnapshot => this.store.get();
  subscribe = (listener: () => void): Unsubscribe => this.store.subscribe(listener);

  get shared(): SharedSession {
    return this.store.get().shared;
  }

  get myId(): PlayerId {
    return this.store.get().myId;
  }

  // ── State ────────────────────────────────────────────────────────────────

  commit(patch: Partial<SharedSession>): void {
    this.store.update((s) => ({
      ...s,
      shared: { ...s.shared, ...patch, hostTime: Date.now(), rev: s.shared.rev + 1 },
    }));
    this.unpublished = true;
    if (this.batchDepth === 0) this.publish();
  }

  /** Runs `fn` and publishes the commits it makes once, at the end. */
  batch(fn: () => void): void {
    this.batchDepth++;
    try {
      fn();
    } finally {
      this.batchDepth--;
    }

    if (this.batchDepth === 0) this.publish();
  }

  end(ended: EndReason): void {
    this.store.update((s) => ({ ...s, ended }));
  }

  // ── Game flow ────────────────────────────────────────────────────────────

  /** Deals a new game to `players`, which starts once the countdown has run out. */
  beginGame(players: PlayerInfo[], countdownMs: number): void {
    const startsAt = Date.now() + countdownMs;
    const game = createGame({
      rules: PRESETS[this.shared.preset],
      playerIds: players.map((p) => p.id),
      hostId: this.myId,
      seed: randomSeed(this.rng),
      ctx: { now: startsAt, rng: this.rng },
    });
    this.commit({
      phase: SessionPhase.Countdown,
      players,
      game,
      gameNumber: this.shared.gameNumber + 1,
      rematch: {},
      countdownEndsAt: startsAt,
    });
    this.timers.after(countdownMs, () =>
      this.batch(() => {
        this.commit({ phase: SessionPhase.Playing, countdownEndsAt: null });
        this.scheduleTurnTimer();
      }),
    );
  }

  act(action: GameAction): MoveOutcome {
    const { game, phase } = this.shared;
    if (this.disposed || !game || phase !== SessionPhase.Playing) return MoveOutcome.Ignored;
    const result = reduce(game, action, { now: Date.now(), rng: this.rng });
    if (result.rejected) return MoveOutcome.Rejected;
    if (result.state === game) return MoveOutcome.Unchanged;
    if (!result.state.finished) {
      this.commit({ game: result.state });
      this.scheduleTurnTimer();
    } else {
      this.cancelTurnTimer?.();
      this.commit({
        game: result.state,
        phase: SessionPhase.Finished,
        ...this.options.onFinish?.(this.shared),
      });
    }

    return MoveOutcome.Applied;
  }

  /** Keeps or releases one die for `by`, who must be the player on turn. */
  toggleHold(by: PlayerId, die: number): MoveOutcome {
    const held = this.shared.game?.turn.held;
    if (!held) return MoveOutcome.Ignored;

    return this.act({ type: ActionType.Hold, by, held: toggleHeld(held, die) });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.timers.clearAll();
    this.cancelTurnTimer?.();
  }

  private scheduleTurnTimer(): void {
    this.cancelTurnTimer?.();
    const deadline = this.shared.game?.turn.deadline;
    if (!deadline) return;
    this.cancelTurnTimer = this.timers.after(Math.max(0, deadline - Date.now()), () =>
      this.batch(() => this.act({ type: ActionType.Timeout })),
    );
  }

  private publish(): void {
    if (!this.unpublished) return;
    this.unpublished = false;
    this.options.publish?.();
  }
}
