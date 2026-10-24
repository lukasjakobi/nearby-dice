import { useState } from 'react';

import type { GameState } from '@/domain';
import { SessionPhase } from '@/session';
import type { PlayerInfo, SessionSnapshot } from '@/session';

type FinishedDisplay = {
  sessionId: string;
  game: GameState;
  players: PlayerInfo[];
  myId: string;
};

/**
 * The game the results show. During a rematch countdown the session already holds the
 * next game, so the last finished one stays on screen until the game screen takes over.
 */
export function useShownGame(snapshot: SessionSnapshot) {
  const { shared, myId } = snapshot;
  const currentGame = shared.game!;
  const [lastFinishedGame, setLastFinishedGame] = useState<FinishedDisplay | null>(null);
  if (
    currentGame.finished &&
    shared.phase === SessionPhase.Finished &&
    (lastFinishedGame?.game !== currentGame || lastFinishedGame.sessionId !== shared.sessionId)
  ) {
    setLastFinishedGame({
      sessionId: shared.sessionId,
      game: currentGame,
      players: shared.players,
      myId,
    });
  }

  const showingPreviousResult =
    shared.phase === SessionPhase.Countdown &&
    !currentGame.finished &&
    lastFinishedGame?.sessionId === shared.sessionId;
  const cachedResult = showingPreviousResult ? lastFinishedGame : null;

  return {
    game: cachedResult?.game ?? currentGame,
    players: cachedResult?.players ?? shared.players,
    myId: cachedResult?.myId ?? myId,
  };
}
