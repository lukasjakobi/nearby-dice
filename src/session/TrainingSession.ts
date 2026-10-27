/**
 * "Training": a single-player game on this phone. Runs the same engine as the host,
 * but without a transport, admission or rematch votes. Screens render its snapshot
 * exactly like a hosted game.
 */
import { ActionType, createGame, Link, PRESETS, randomSeed, reduce } from '@/domain';
import type { Category, GameAction, GameState, Held, PresetId, Profile, Rng } from '@/domain';
import { randomId, secureRandomId, Store, Timers } from '@/lib';
import type { Unsubscribe } from '@/lib';

import { TIMING } from './timing';
import { ConnectionStatus, EndReason, Role, SessionPhase } from './types';
import type { PlayerInfo, SessionSnapshot, SharedSession, TrainingController } from './types';

export type TrainingOptions = {
  profile: Profile;
  preset: PresetId;
  rng?: Rng;
};

export class TrainingSession implements TrainingController {
  readonly role = Role.Training;
  private readonly store: Store<SessionSnapshot>;
  private readonly timers = new Timers();
  private readonly rng: Rng;
  private cancelTurnTimer: (() => void) | null = null;
  private disposed = false;

  /** Creates the session and starts the countdown to the first game. */
  constructor(options: TrainingOptions) {
    this.rng = options.rng ?? Math.random;
    const me: PlayerInfo = {
      id: randomId(),
      name: options.profile.name,
      color: options.profile.color,
      isHost: true,
      link: Link.Connected,
    };
    this.store = new Store<SessionSnapshot>({
      role: Role.Training,
      myId: me.id,
      connection: { status: ConnectionStatus.Connected, attempt: 0 },
      ended: null,
      clockOffset: 0,
      shared: {
        sessionId: secureRandomId(),
        code: '',
        roundName: '',
        preset: options.preset,
        maxPlayers: 1,
        allowRejoin: false,
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
    this.beginGame();
  }

  // ── Reading ──────────────────────────────────────────────────────────────

  getSnapshot = (): SessionSnapshot => this.store.get();
  subscribe = (listener: () => void): Unsubscribe => this.store.subscribe(listener);

  private get shared(): SharedSession {
    return this.store.get().shared;
  }

  private get myId(): string {
    return this.store.get().myId;
  }

  // ── Commands ─────────────────────────────────────────────────────────────

  roll(): void {
    this.act({ type: ActionType.Roll, by: this.myId });
  }

  toggleHold(die: number): void {
    const held = this.shared.game?.turn.held;
    if (!held) return;
    const next = held.map((h, i) => (i === die ? !h : h)) as unknown as Held;
    this.act({ type: ActionType.Hold, by: this.myId, held: next });
  }

  score(category: Category, sheet: number): void {
    this.act({ type: ActionType.Score, by: this.myId, category, sheet });
  }

  /** Nobody else to show it to. */
  focus(): void {}

  viewSheet(sheet: number): void {
    this.act({ type: ActionType.ViewSheet, by: this.myId, sheet });
  }

  /** Nobody to vote with; `restart` starts the next game. */
  voteRematch(): void {}

  restart(): void {
    if (this.disposed || this.shared.phase !== SessionPhase.Finished) return;
    this.beginGame();
  }

  setPreset(preset: PresetId): void {
    if (this.disposed || this.shared.phase !== SessionPhase.Finished) return;
    this.commit({ preset });
  }

  leave(): void {
    if (this.disposed) return;
    this.store.update((s) => ({ ...s, ended: EndReason.Left }));
    this.dispose();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.timers.clearAll();
    this.cancelTurnTimer?.();
  }

  // ── Game flow ────────────────────────────────────────────────────────────

  private beginGame(): void {
    const startsAt = Date.now() + TIMING.trainingCountdown;
    const game = createGame({
      rules: PRESETS[this.shared.preset],
      playerIds: [this.myId],
      hostId: this.myId,
      seed: randomSeed(this.rng),
      ctx: { now: startsAt, rng: this.rng },
    });
    this.commit({
      phase: SessionPhase.Countdown,
      game,
      gameNumber: this.shared.gameNumber + 1,
      countdownEndsAt: startsAt,
    });
    this.timers.after(TIMING.trainingCountdown, () => {
      this.commit({ phase: SessionPhase.Playing, countdownEndsAt: null });
      this.scheduleTurnTimer();
    });
  }

  private act(action: GameAction): void {
    const { game, phase } = this.shared;
    if (this.disposed || !game || phase !== SessionPhase.Playing) return;
    const result = reduce(game, action, { now: Date.now(), rng: this.rng });
    if (result.rejected) return;
    this.applyGame(result.state);
  }

  private applyGame(game: GameState): void {
    if (!game.finished) {
      this.commit({ game });
      this.scheduleTurnTimer();

      return;
    }

    this.cancelTurnTimer?.();
    this.commit({ game, phase: SessionPhase.Finished });
  }

  private scheduleTurnTimer(): void {
    this.cancelTurnTimer?.();
    const deadline = this.shared.game?.turn.deadline;
    if (!deadline) return;
    this.cancelTurnTimer = this.timers.after(Math.max(0, deadline - Date.now()), () =>
      this.act({ type: ActionType.Timeout }),
    );
  }

  // ── State ────────────────────────────────────────────────────────────────

  private commit(patch: Partial<SharedSession>): void {
    this.store.update((s) => ({
      ...s,
      shared: { ...s.shared, ...patch, hostTime: Date.now(), rev: s.shared.rev + 1 },
    }));
  }
}
