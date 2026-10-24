import { Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { EndReason, Role, setActiveSession, useSessionSnapshot } from '@/session';
import type { AnySession } from '@/session';
import { navigate } from '@/shared';

import { allowedRoutes } from '../routing';
import { SessionContext } from '../SessionContext';
import { useInterruptionRecord, useKeepAwakeSetting, useSessionToasts } from '../hooks';
import { SessionEndedView } from './SessionEndedView';

/** Provides one live session, keeps the route in step with its phase, and handles its end. */
export function ActiveSessionLayout({ session }: { session: AnySession }) {
  const { t } = useTranslation();
  const snapshot = useSessionSnapshot(session);
  const pathname = usePathname();
  useSessionToasts(snapshot);
  useInterruptionRecord(session, snapshot);
  useKeepAwakeSetting();

  const ending =
    snapshot.ended && snapshot.ended !== EndReason.Left
      ? {
          title: t(`errors.sessionEnd.${snapshot.ended}.title`),
          body: t(`errors.sessionEnd.${snapshot.ended}.body`),
        }
      : null;
  const leaveNow = snapshot.ended !== null && (session.role !== Role.Guest || !ending);

  useEffect(() => {
    if (leaveNow) {
      setActiveSession(null);

      return;
    }

    if (snapshot.ended) return;
    const routes = allowedRoutes(snapshot);
    if (!routes.some((route) => route === pathname)) navigate.replace(routes[0]);
  }, [snapshot, pathname, leaveNow]);

  if (snapshot.ended && ending && session.role === Role.Guest) {
    return <SessionEndedView title={ending.title} body={ending.body} />;
  }

  return (
    <SessionContext.Provider value={{ session, snapshot }}>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
    </SessionContext.Provider>
  );
}
