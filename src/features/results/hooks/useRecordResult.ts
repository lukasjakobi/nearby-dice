import { useEffect, useRef } from 'react';

import { Role, SessionPhase } from '@/session';
import type { SessionSnapshot } from '@/session';
import { useStatsStore } from '@/store';
import { useFeedback } from '@/shared';

import type { RankRow } from '../view';

/** Identifies a game in the statistics; a rematch gets a new one. */
export const gameIdOf = ({ shared }: SessionSnapshot) => `${shared.sessionId}-${shared.gameNumber}`;

/** Once per finished game: the finish sound, and the game into the statistics. */
export function useRecordResult(snapshot: SessionSnapshot, rows: readonly RankRow[]) {
  const feedback = useFeedback();
  const record = useStatsStore((s) => s.record);
  const recordTraining = useStatsStore((s) => s.recordTraining);
  const { shared, myId } = snapshot;
  const currentGame = shared.game!;
  const gameId = gameIdOf(snapshot);
  const training = snapshot.role === Role.Training;

  const soundedGame = useRef<string | null>(null);
  useEffect(() => {
    if (
      shared.phase !== SessionPhase.Finished ||
      !currentGame.finished ||
      soundedGame.current === gameId
    )
      return;
    soundedGame.current = gameId;
    feedback.finish();
  }, [currentGame.finished, shared.phase, gameId, feedback]);

  // Only finished games are recorded; a rematch countdown already has a new game number.
  useEffect(() => {
    if (shared.phase !== SessionPhase.Finished || !currentGame.finished) return;
    const me = rows.find((r) => r.isMe);
    if (!me) return;
    if (training) {
      recordTraining({ id: gameId, points: me.points });

      return;
    }

    record({
      id: gameId,
      playedAt: Date.now(),
      myId,
      players: shared.players.map(({ id, name, color }) => ({ id, name, color })),
      game: currentGame,
    });
  }, [
    currentGame,
    gameId,
    myId,
    record,
    recordTraining,
    rows,
    shared.phase,
    shared.players,
    training,
  ]);
}
