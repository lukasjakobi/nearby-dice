import { useEffect } from 'react';

import { currentRound, turnsPerPlayer } from '@/domain';
import { ConnectionStatus, hostOf, Role, SessionPhase } from '@/session';
import type { AnySession, SessionSnapshot } from '@/session';
import { useInterruptedStore } from '@/store';

/**
 * Keeps what "Unterbrochene Sitzung" needs while a guest is in a game, so the start
 * screen can offer to resume after a lost connection or an app restart.
 */
export function useInterruptionRecord(session: AnySession, snapshot: SessionSnapshot): void {
  const remember = useInterruptedStore((s) => s.remember);
  const forget = useInterruptedStore((s) => s.forget);

  useEffect(() => {
    if (session.role !== Role.Guest) return;
    const { shared, connection, ended } = snapshot;
    if (ended || shared.phase === SessionPhase.Finished) {
      forget();

      return;
    }

    if (shared.phase !== SessionPhase.Playing || !shared.game) return;
    if (connection.status !== ConnectionStatus.Connected) return;
    remember({
      code: shared.code,
      hostName: hostOf(snapshot).name,
      rejoinToken: session.rejoinToken,
      round: currentRound(shared.game),
      totalRounds: turnsPerPlayer(shared.game.rules),
      otherPlayers: shared.players
        .filter((p) => p.id !== snapshot.myId && !p.isHost)
        .map((p) => p.name),
      lastSeenAt: Date.now(),
    });
  }, [session, snapshot, remember, forget]);
}
