import { ActionType } from '@/domain';
import type { PlayerAction } from '@/domain';
import type { Unsubscribe } from '@/lib';
import { RematchVote, SessionPhase } from '@/session';
import type { SessionController } from '@/session';

import { botMove } from './botMove';

export type BotOptions = {
  /** Pause before each move (ms). */
  thinkMs?: number;
  /** Vote for or against a rematch, or never vote. */
  rematch?: RematchVote.Yes | RematchVote.No | null;
};

/**
 * Plays a session like a person would, through the same controller the UI uses.
 * Used by the session integration tests and the browser harness's scenarios.
 */
export class BotPlayer {
  private readonly unsubscribe: Unsubscribe;
  private pending: ReturnType<typeof setTimeout> | null = null;
  private lastRev = -1;

  constructor(
    private readonly session: SessionController,
    private readonly options: BotOptions = {},
  ) {
    this.unsubscribe = session.subscribe(() => this.react());
    this.react();
  }

  stop(): void {
    this.unsubscribe();
    if (this.pending) clearTimeout(this.pending);
  }

  private react(): void {
    const { shared, myId, ended } = this.session.getSnapshot();
    if (ended) return this.stop();
    if (shared.rev === this.lastRev || this.pending) return;
    this.lastRev = shared.rev;

    if (shared.phase === SessionPhase.Playing && shared.game) {
      const move = botMove(shared.game, myId);
      if (move) this.later(() => this.perform(move));
    }

    const vote = this.options.rematch;
    if (
      shared.phase === SessionPhase.Finished &&
      vote &&
      shared.rematch[myId] === RematchVote.Pending
    ) {
      this.later(() => this.session.voteRematch(vote), 3);
    }
  }

  private perform(move: PlayerAction): void {
    switch (move.type) {
      case ActionType.Roll:
        return this.session.roll();
      case ActionType.Hold: {
        const current = this.session.getSnapshot().shared.game?.turn.held;
        move.held.forEach((h, i) => {
          if (current && current[i] !== h) this.session.toggleHold(i);
        });

        return;
      }

      case ActionType.Score:
        return this.session.score(move.category, move.sheet);
    }
  }

  private later(fn: () => void, factor = 1): void {
    this.pending = setTimeout(
      () => {
        this.pending = null;
        fn();
        this.react();
      },
      (this.options.thinkMs ?? 900) * factor,
    );
  }
}
