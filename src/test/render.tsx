import { render } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionContext } from '@/features/session/SessionContext';
import type { AnySession, SessionSnapshot } from '@/session/types';
import { ColorScheme, ThemeProvider, ToastProvider } from '@/ui';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/** The app's providers, also usable as a `renderHook` wrapper. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <ThemeProvider scheme={ColorScheme.Light}>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/** Renders with the app's providers; pass a session to render session screens. */
export async function renderScreen(
  ui: ReactElement,
  session?: { session: AnySession; snapshot: SessionSnapshot },
) {
  const content = session ? (
    <SessionContext.Provider value={session}>{ui}</SessionContext.Provider>
  ) : (
    ui
  );

  return await render(<AppProviders>{content}</AppProviders>);
}

/** A controller whose commands are jest mocks; enough for screen tests. */
export function fakeSession(snapshot: SessionSnapshot): AnySession {
  const base = {
    role: snapshot.role,
    getSnapshot: () => snapshot,
    subscribe: () => () => {},
    roll: jest.fn(),
    toggleHold: jest.fn(),
    score: jest.fn(),
    focus: jest.fn(),
    viewSheet: jest.fn(),
    voteRematch: jest.fn(),
    leave: jest.fn(),
    dispose: jest.fn(),
    // host
    start: jest.fn(),
    kick: jest.fn(),
    closeLobby: jest.fn(),
    skipTurn: jest.fn(),
    removeFromGame: jest.fn(),
    startRematch: jest.fn(),
    setPreset: jest.fn(),
    endForAll: jest.fn(),
    // guest
    rejoinToken: 'token',
    reconnect: jest.fn(),
    // training
    restart: jest.fn(),
  };

  return base as unknown as AnySession;
}
