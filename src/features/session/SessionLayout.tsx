import { useEffect } from 'react';

import { useActiveSession } from '@/session';
import { goHome } from '@/shared';

import { ActiveSessionLayout } from './components';

/**
 * Wraps every in-session screen: provides the session, moves to the screen that
 * matches its phase, and handles the session ending.
 */
export function SessionLayout() {
  const session = useActiveSession();
  useEffect(() => {
    if (!session) goHome();
  }, [session]);

  return session ? <ActiveSessionLayout session={session} /> : null;
}
