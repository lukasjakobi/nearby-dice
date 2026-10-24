/**
 * Turns a session snapshot into everything the game screen shows. Pure, so the
 * rules for each visual state live in one testable place, not in components.
 *
 * Each part of the screen has its own builder, all reading the same `TurnContext`:
 * `sheetView` (scorecard), `controlView` (dice and roll button), `statusView`
 * (player pills and banner).
 */
import type { TFunction } from '@/i18n';
import { currentRound, turnsPerPlayer } from '@/domain';
import { ConnectionStatus, Role, SessionPhase, toLocalTime } from '@/session';
import type { SessionSnapshot } from '@/session';

import { buildControl, buildDice } from './controlView';
import type { ControlView, DieView } from './controlView';
import { buildSheet, focusedCellOf } from './sheetView';
import type { SheetView } from './sheetView';
import { buildBanner, buildPills, lostPlayerOf } from './statusView';
import type { BannerView, PillView } from './statusView';
import { turnContext } from './turnContext';
import type { LocalState, TurnContext } from './turnContext';

export type GameView = {
  roundLabel: string;
  pills: PillView[];
  banner: BannerView | null;
  cardDimmed: boolean;
  sheet: SheetView;
  dice: DieView[];
  control: ControlView;
  /**
   * Time bar for whoever's turn it is, with a time limit; `deadline` is local time.
   * It stays while that player is unreachable: the host still auto-scores at the deadline.
   */
  timer: { deadline: number; limitMs: number; lowMs: number } | null;
  /** A player who lost the connection; `canSkip` only for the player whose turn it is. */
  lostPlayer: { id: string; name: string; canSkip: boolean } | null;
  isHost: boolean;
  /** Local timestamp; the countdown overlay shows until then. */
  countdownEndsAt: number | null;
  finished: boolean;
  connectionFailed: boolean;
};

const LOW_TIME_MS = 10_000;

export function buildGameView(
  t: TFunction,
  snapshot: SessionSnapshot,
  local: LocalState,
): GameView | null {
  const ctx = turnContext(snapshot, local);
  if (!ctx) return null;
  const { shared, connection } = snapshot;

  const sheet = buildSheet(t, ctx);
  const focused = focusedCellOf(sheet);
  const lost = lostPlayerOf(ctx);

  return {
    roundLabel: t('game.round', { n: currentRound(ctx.game), total: turnsPerPlayer(ctx.rules) }),
    pills: buildPills(ctx),
    banner: buildBanner(t, ctx, lost),
    cardDimmed: !ctx.connected,
    sheet,
    dice: buildDice(t, ctx, focused),
    control: buildControl(t, ctx, focused),
    timer: timerOf(ctx),
    lostPlayer: lost
      ? { id: lost.id, name: lost.name, canSkip: lost.id === ctx.turn.playerId }
      : null,
    isHost: snapshot.role === Role.Host,
    countdownEndsAt:
      shared.phase === SessionPhase.Countdown && shared.countdownEndsAt
        ? toLocalTime(snapshot, shared.countdownEndsAt)
        : null,
    finished: shared.phase === SessionPhase.Finished,
    connectionFailed: connection.status === ConnectionStatus.Failed,
  };
}

function timerOf(ctx: TurnContext): GameView['timer'] {
  const limitMs = ctx.rules.secondsPerTurn * 1000;
  const deadline = ctx.turn.deadline ? toLocalTime(ctx.snapshot, ctx.turn.deadline) : null;

  return limitMs > 0 && deadline && ctx.playing ? { deadline, limitMs, lowMs: LOW_TIME_MS } : null;
}
