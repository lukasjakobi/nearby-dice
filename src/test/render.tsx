import { act, render } from '@testing-library/react-native';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionContext } from '@/features/session/SessionContext';
import type { AnySession, SessionSnapshot } from '@/session/types';
import { ColorScheme, ThemeProvider, ToastProvider } from '@/ui';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

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

  return await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ThemeProvider scheme={ColorScheme.Light}>
        <ToastProvider>{content}</ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

/**
 * Renders a session screen whose snapshot the test replaces with `update`, as the host's
 * broadcasts would; the commands are jest mocks (see `fakeSession`).
 */
export async function renderLiveSession(ui: ReactElement, snap: SessionSnapshot) {
  const session = fakeSession(snap);
  let update: (next: SessionSnapshot) => void = () => {};

  function LiveSession() {
    const [value, setValue] = useState(snap);
    update = setValue;

    return (
      <SessionContext.Provider value={{ session, snapshot: value }}>{ui}</SessionContext.Provider>
    );
  }

  await renderScreen(<LiveSession />);

  return { session, update: (next: SessionSnapshot) => act(() => update(next)) };
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
