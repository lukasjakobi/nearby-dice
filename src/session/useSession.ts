import { useSyncExternalStore } from 'react';

import { activeSession } from './activeSession';
import type { ScanState, RoundScanner } from './RoundScanner';
import type { AnySession, SessionController, SessionSnapshot } from './types';

export function useActiveSession(): AnySession | null {
  return useSyncExternalStore(activeSession.subscribe, activeSession.get);
}

export function useSessionSnapshot(session: SessionController): SessionSnapshot {
  return useSyncExternalStore(session.subscribe, session.getSnapshot);
}

export function useScanState(scanner: RoundScanner): ScanState {
  return useSyncExternalStore(scanner.state.subscribe, scanner.state.get);
}
