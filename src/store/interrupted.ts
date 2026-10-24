import { isRecord } from '@/domain';

import { createPersistedStore } from './createPersistedStore';
import { nonNegative } from './storage';

/** Enough to offer "Unterbrochene Sitzung" on the start screen and rejoin the same seat. */
export type InterruptedSession = {
  code: string;
  hostName: string;
  rejoinToken: string;
  round: number;
  totalRounds: number;
  otherPlayers: string[];
  /** When this phone last heard from the host. */
  lastSeenAt: number;
};

type InterruptedData = { interrupted: InterruptedSession | null };

const DEFAULTS: InterruptedData = { interrupted: null };

function sanitizeInterrupted(stored: Record<string, unknown>): Partial<InterruptedData> {
  const state: Partial<InterruptedData> = {};
  const session = stored.interrupted;
  if (session === null) state.interrupted = null;
  else if (
    isRecord(session) &&
    typeof session.code === 'string' &&
    typeof session.hostName === 'string' &&
    typeof session.rejoinToken === 'string' &&
    nonNegative(session.round) &&
    nonNegative(session.totalRounds) &&
    Array.isArray(session.otherPlayers) &&
    session.otherPlayers.every((player) => typeof player === 'string') &&
    nonNegative(session.lastSeenAt)
  ) {
    state.interrupted = {
      code: session.code,
      hostName: session.hostName,
      rejoinToken: session.rejoinToken,
      round: session.round,
      totalRounds: session.totalRounds,
      otherPlayers: session.otherPlayers,
      lastSeenAt: session.lastSeenAt,
    };
  }

  return state;
}

export const useInterruptedStore = createPersistedStore({
  key: 'nearbydice.interrupted.v1',
  defaults: DEFAULTS,
  sanitize: sanitizeInterrupted,
  actions: (update) => ({
    remember: (interrupted: InterruptedSession) => update(() => ({ interrupted })),
    forget: () => update(() => ({ interrupted: null })),
  }),
});
