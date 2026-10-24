import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';

import { Link } from '@/domain';
import { ConnectionStatus, Role, SessionPhase } from '@/session';
import type { PlayerInfo, SessionSnapshot } from '@/session';
import { useToast } from '@/ui';
import { useFeedback } from '@/shared';

const isAway = (p: PlayerInfo) => p.link === Link.Lost || p.link === Link.Left;

/** Toasts for people arriving and coming back and for a new mode, derived from snapshot changes. */
export function useSessionToasts(snapshot: SessionSnapshot): void {
  const { t } = useTranslation();
  const toast = useToast();
  const feedback = useFeedback();
  const previous = useRef(snapshot);

  useEffect(() => {
    const before = previous.current;
    previous.current = snapshot;
    if (before === snapshot) return;

    if (
      before.connection.status === ConnectionStatus.Reconnecting &&
      snapshot.connection.status === ConnectionStatus.Connected
    ) {
      toast.show(t('common.connectionBack'));

      return;
    }

    // Guests always learn of a new mode; the host sees its own pick confirmed only in the lobby.
    const toldOfPreset =
      snapshot.role === Role.Guest ||
      (snapshot.role === Role.Host && snapshot.shared.phase === SessionPhase.Lobby);
    if (toldOfPreset && before.shared.preset !== snapshot.shared.preset) {
      toast.show(
        t('common.styleChanged', { style: t(`labels.preset.${snapshot.shared.preset}.title`) }),
      );
    }

    const inLobby = snapshot.shared.phase === SessionPhase.Lobby;
    for (const player of snapshot.shared.players) {
      if (player.id === snapshot.myId) continue;
      const earlier = before.shared.players.find((p) => p.id === player.id);
      if (!earlier && inLobby) {
        toast.show(t('common.joined', { name: player.name }));
        feedback.join();
      } else if (earlier && isAway(earlier) && player.link === Link.Connected) {
        toast.show(
          inLobby
            ? t('common.reconnected', { name: player.name })
            : t('game.playerBack', { name: player.name }),
        );
      }
    }
  }, [snapshot, toast, feedback, t]);
}
