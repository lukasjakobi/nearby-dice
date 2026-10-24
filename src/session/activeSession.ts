/**
 * The one session this phone is in (or none), plus the shared round scanner.
 * React reads both through the hooks in `useSession.ts`.
 */
import { Store } from '@/lib';
import { getTransport } from '@/net';

import { RoundScanner } from './RoundScanner';
import type { AnySession } from './types';

export const activeSession = new Store<AnySession | null>(null);

/** Replaces the active session; the previous one is disposed. */
export function setActiveSession(session: AnySession | null): void {
  const previous = activeSession.get();
  if (previous && previous !== session) previous.dispose();
  activeSession.set(session);
}

let scanner: RoundScanner | null = null;

export function getRoundScanner(): RoundScanner {
  scanner ??= new RoundScanner(getTransport());

  return scanner;
}
