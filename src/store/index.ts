import { useEffect, useState } from 'react';

import { persistedStores } from './createPersistedStore';

export { useProfileStore } from './profile';
export { useSettingsStore, LanguageMode, ThemeMode, VOLUME_STEP } from './settings';
export type { VolumeKey } from './settings';
export { useStatsStore } from './stats';
export { useInterruptedStore } from './interrupted';
export type { InterruptedSession } from './interrupted';

/** True once every persisted store has loaded from disk. */
export function useStoresHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    persistedStores.every((s) => s.persist.hasHydrated()),
  );
  useEffect(() => {
    if (hydrated) return;
    const check = () => setHydrated(persistedStores.every((s) => s.persist.hasHydrated()));
    const unsubscribers = persistedStores.map((s) => s.persist.onFinishHydration(check));
    check();

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [hydrated]);

  return hydrated;
}
