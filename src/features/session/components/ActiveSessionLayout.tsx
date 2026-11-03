import { Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';

import { EndReason, Role, setActiveSession, useSessionSnapshot } from '@/session';
import type { AnySession } from '@/session';
import { navigate } from '@/shared';

import { allowedRoutes } from '../routing';
import { SessionContext } from '../SessionContext';
import { useInterruptionRecord, useKeepAwakeSetting, useSessionToasts } from '../hooks';
import { SessionEndedView } from './SessionEndedView';

/** Provides one live session, keeps the route in step with its phase, and handles its end. */
export function ActiveSessionLayout({ session }: { session: AnySession }) {
  const snapshot = useSessionSnapshot(session);
  const pathname = usePathname();
  useSessionToasts(snapshot);
  useInterruptionRecord(session, snapshot);
  useKeepAwakeSetting();

  const shownEnd =
    session.role === Role.Guest && snapshot.ended !== EndReason.Left ? snapshot.ended : null;
  const leaveNow = snapshot.ended !== null && !shownEnd;

  useEffect(() => {
    if (leaveNow) {
      setActiveSession(null);

      return;
    }

    if (snapshot.ended) return;
    const routes = allowedRoutes(snapshot);
    if (!routes.some((route) => route === pathname)) navigate.replace(routes[0]);
  }, [snapshot, pathname, leaveNow]);

  if (shownEnd) {
    return <SessionEndedView reason={shownEnd} />;
  }

  return (
    <SessionContext.Provider value={{ session, snapshot }}>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
    </SessionContext.Provider>
  );
}
