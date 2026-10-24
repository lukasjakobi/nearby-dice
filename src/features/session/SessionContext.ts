import { createContext, useContext } from 'react';

import { Role } from '@/session';
import type { AnySession, GuestController, HostController, SessionSnapshot } from '@/session';

export type SessionValue = { session: AnySession; snapshot: SessionSnapshot };

export const SessionContext = createContext<SessionValue | null>(null);

/** The active session and its snapshot. Only inside the `(session)` route group. */
export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside the session layout');

  return value;
}

/** For host-only screens; the routing guarantees the role. */
export function useHostSession(): { session: HostController; snapshot: SessionSnapshot } {
  const { session, snapshot } = useSession();
  if (session.role !== Role.Host) throw new Error('Expected a host session');

  return { session, snapshot };
}

/** For guest-only screens; the routing guarantees the role. */
export function useGuestSession(): { session: GuestController; snapshot: SessionSnapshot } {
  const { session, snapshot } = useSession();
  if (session.role !== Role.Guest) throw new Error('Expected a guest session');

  return { session, snapshot };
}
