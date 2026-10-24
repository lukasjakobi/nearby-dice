import { useEffect, useRef, useState } from 'react';

import { AbortedError } from '@/lib';
import { getTransport } from '@/net';
import { getRoundScanner, GuestSession, setActiveSession } from '@/session';
import { useInterruptedStore, useProfileStore } from '@/store';
import type { InterruptedSession } from '@/store';
import { navigate, Route, useProfileOrGuest } from '@/shared';

export enum ResumeState {
  Idle = 'idle',
  Searching = 'searching',
  Success = 'success',
  Failed = 'failed',
}

/** "Fortsetzen" for an interrupted session: up to three attempts to reach the host. */
export function useResume(interrupted: InterruptedSession | null) {
  const profile = useProfileOrGuest();
  const deviceId = useProfileStore((s) => s.deviceId);
  const forget = useInterruptedStore((s) => s.forget);
  const [state, setState] = useState(ResumeState.Idle);
  const [attempt, setAttempt] = useState(1);
  const resumed = useRef<GuestSession | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      abort.current?.abort();
      resumed.current?.dispose();
      resumed.current = null;
    },
    [],
  );

  const start = async () => {
    if (!interrupted) return;
    abort.current?.abort();
    resumed.current?.dispose();
    resumed.current = null;
    const controller = new AbortController();
    abort.current = controller;
    setAttempt(1);
    setState(ResumeState.Searching);
    try {
      const session = await GuestSession.resume({
        transport: getTransport(),
        scanner: getRoundScanner(),
        deviceId,
        profile,
        code: interrupted.code,
        rejoinToken: interrupted.rejoinToken,
        onAttempt: setAttempt,
        signal: controller.signal,
      });
      // Cancelled while the handshake was finishing: nobody will use this session.
      if (controller.signal.aborted) {
        session.dispose();

        return;
      }

      resumed.current = session;
      setState(ResumeState.Success);
    } catch (error) {
      if (!controller.signal.aborted && !(error instanceof AbortedError)) {
        setState(ResumeState.Failed);
      }
    }
  };

  return {
    state,
    attempt,
    start: () => void start(),
    cancel: () => {
      abort.current?.abort();
      resumed.current?.dispose();
      resumed.current = null;
      setState(ResumeState.Idle);
    },
    enterGame: () => {
      const session = resumed.current;
      if (!session) return;
      // The game owns the session from here on; it must not be disposed by this hook.
      resumed.current = null;
      setActiveSession(session);
      setState(ResumeState.Idle);
      navigate.push(Route.Game);
    },
    discard: forget,
  };
}
