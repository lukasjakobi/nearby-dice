import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';

import { Category, HistoryKind, lastEntry, sameTurn } from '@/domain';
import type { Focus, Turn } from '@/domain';
import { playerById } from '@/session';
import type { SessionSnapshot } from '@/session';
import { DEFAULT_TOAST_OFFSET, useToast } from '@/ui';
import { useFeedback } from '@/shared';
import type { Feedback } from '@/shared';

const sameFocus = (a: Focus | null, b: Focus | null) =>
  a?.category === b?.category && a?.sheet === b?.sheet;

/** Plays what another player's phone played on tap for this step of their turn. */
function playWatchedMove(before: Turn, after: Turn, feedback: Feedback): void {
  if (after.rollSeq > before.rollSeq) {
    feedback.roll();

    return;
  }

  const die = after.held.findIndex((held, i) => held !== before.held[i]);
  if (die >= 0) feedback.hold(after.held[die]!);
  else if (after.focus && !sameFocus(before.focus, after.focus)) feedback.tap();
}

/**
 * Toasts, sounds and haptics that react to the game itself, not to my own taps.
 * Every phone hears every move: my own rolls, holds and field picks sound on tap, the
 * other players' when their snapshot arrives. Other players' moves never vibrate.
 */
export function useGameFeedback(snapshot: SessionSnapshot) {
  const { t } = useTranslation();
  const toast = useToast();
  const feedback = useFeedback();
  const watching = useFeedback({ vibrate: false });
  const game = snapshot.shared.game;

  // The turn passed to me: a nudge, since the phone may be lying on the table.
  const turnPlayer = game?.turn.playerId;
  const lastTurnPlayer = useRef(turnPlayer);
  useEffect(() => {
    const previous = lastTurnPlayer.current;
    lastTurnPlayer.current = turnPlayer;
    if (previous && turnPlayer === snapshot.myId && previous !== turnPlayer) feedback.turn();
  }, [turnPlayer, snapshot.myId, feedback]);

  // Another player's roll, hold or field pick.
  const turn = game?.turn;
  const lastTurn = useRef(turn);
  useEffect(() => {
    const before = lastTurn.current;
    lastTurn.current = turn;
    if (!before || !turn || turn.playerId === snapshot.myId || !sameTurn(before, turn)) return;
    playWatchedMove(before, turn, watching);
  }, [turn, snapshot.myId, watching]);

  // A sound for every entered field; a toast for automatic picks and other players' fields.
  const lastSeq = useRef(game?.history.length ?? 0);
  useEffect(() => {
    if (!game) return;
    const entry = lastEntry(game);
    if (!entry || entry.seq <= lastSeq.current) return;
    lastSeq.current = entry.seq;
    if (entry.kind !== HistoryKind.Scored && entry.kind !== HistoryKind.AutoScored) return;
    const label = t(`labels.category.${entry.category}`);
    const mine = entry.playerId === snapshot.myId;
    if (entry.kind === HistoryKind.AutoScored)
      toast.show(t('game.timeout', { label, value: entry.points }));
    else if (!mine)
      toast.show(
        t('game.scored', {
          name: playerById(snapshot, entry.playerId)?.name ?? '',
          label,
          value: entry.points,
        }),
      );
    const entryFeedback = mine ? feedback : watching;
    if (entry.points === 0) entryFeedback.strike();
    else if (entry.category === Category.Yatzy) entryFeedback.yatzy();
    else entryFeedback.score();
  }, [game, snapshot, toast, feedback, watching, t]);

  // Toasts sit above the action bar while the game is on screen.
  const { setOffset } = toast;
  useEffect(() => {
    setOffset(220);

    return () => setOffset(DEFAULT_TOAST_OFFSET);
  }, [setOffset]);
}
