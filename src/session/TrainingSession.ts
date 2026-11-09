/**
 * "Training": a single-player game on this phone. Runs the same game core as the
 * host, but without a transport, admission or rematch votes. Screens render its
 * snapshot exactly like a hosted game.
 */
import { ActionType } from '@/domain';
import type { Category, PresetId, Profile, Rng } from '@/domain';
import type { Unsubscribe } from '@/lib';

import { GameCore } from './gameCore';
import { TIMING } from './timing';
import { EndReason, Role, SessionPhase } from './types';
import type { SessionSnapshot, TrainingController } from './types';

export type TrainingOptions = {
  profile: Profile;
  preset: PresetId;
  rng?: Rng;
};

export class TrainingSession implements TrainingController {
  readonly role = Role.Training;
  private readonly core: GameCore;
  private disposed = false;

  /** Creates the session and starts the countdown to the first game. */
  constructor(options: TrainingOptions) {
    this.core = new GameCore({
      role: Role.Training,
      profile: options.profile,
      settings: {
        code: '',
        roundName: '',
        preset: options.preset,
        maxPlayers: 1,
        allowRejoin: false,
      },
      rng: options.rng,
    });
    this.beginGame();
  }

  // ── Reading ──────────────────────────────────────────────────────────────

  getSnapshot = (): SessionSnapshot => this.core.getSnapshot();
  subscribe = (listener: () => void): Unsubscribe => this.core.subscribe(listener);

  // ── Commands ─────────────────────────────────────────────────────────────

  roll(): void {
    this.core.act({ type: ActionType.Roll, by: this.core.myId });
  }

  toggleHold(die: number): void {
    this.core.toggleHold(this.core.myId, die);
  }

  score(category: Category, sheet: number): void {
    this.core.act({ type: ActionType.Score, by: this.core.myId, category, sheet });
  }

  /** Nobody else to show it to. */
  focus(): void {}

  viewSheet(sheet: number): void {
    this.core.act({ type: ActionType.ViewSheet, by: this.core.myId, sheet });
  }

  /** Nobody to vote with; `restart` starts the next game. */
  voteRematch(): void {}

  restart(): void {
    if (this.disposed || this.core.shared.phase !== SessionPhase.Finished) return;
    this.beginGame();
  }

  setPreset(preset: PresetId): void {
    if (this.disposed || this.core.shared.phase !== SessionPhase.Finished) return;
    this.core.commit({ preset });
  }

  leave(): void {
    if (this.disposed) return;
    this.core.end(EndReason.Left);
    this.dispose();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.core.dispose();
  }

  private beginGame(): void {
    this.core.beginGame(this.core.shared.players, TIMING.trainingCountdown);
  }
}
