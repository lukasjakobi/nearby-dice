import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';

import { Category, HistoryKind, lastEntry } from '@/domain';
import { playerById } from '@/session';
import type { SessionSnapshot } from '@/session';
import { DEFAULT_TOAST_OFFSET, useToast } from '@/ui';
import { useFeedback } from '@/shared';

/** Toasts, sounds and haptics that react to the game itself, not to my own taps. */
export function useGameFeedback(snapshot: SessionSnapshot) {
  const { t } = useTranslation();
  const toast = useToast();
  const feedback = useFeedback();
  const game = snapshot.shared.game;

  // The turn passed to me: a nudge, since the phone may be lying on the table.
  const turnPlayer = game?.turn.playerId;
  const lastTurnPlayer = useRef(turnPlayer);
  useEffect(() => {
    const previous = lastTurnPlayer.current;
    lastTurnPlayer.current = turnPlayer;
    if (previous && turnPlayer === snapshot.myId && previous !== turnPlayer) feedback.turn();
  }, [turnPlayer, snapshot.myId, feedback]);

  // One toast per history entry: automatic picks and other players' fields.
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
    if (mine) {
      if (entry.points === 0) feedback.strike();
      else if (entry.category === Category.Yatzy) feedback.yatzy();
      else feedback.score();
    }
  }, [game, snapshot, toast, feedback, t]);

  // Toasts sit above the action bar while the game is on screen.
  const { setOffset } = toast;
  useEffect(() => {
    setOffset(220);

    return () => setOffset(DEFAULT_TOAST_OFFSET);
  }, [setOffset]);
}
