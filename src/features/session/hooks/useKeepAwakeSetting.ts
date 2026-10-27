import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';

import { useSettingsStore } from '@/store';

const TAG = 'session';

// Best effort: the system may refuse, as browsers do for a tab in the background.
const ignore = () => {};

/** "Bildschirm anlassen": keeps the screen on in the lobby and during the game. */
export function useKeepAwakeSetting(): void {
  const keepAwake = useSettingsStore((s) => s.keepAwake);
  useEffect(() => {
    if (!keepAwake) return;
    activateKeepAwakeAsync(TAG).catch(ignore);

    return () => void deactivateKeepAwake(TAG).catch(ignore);
  }, [keepAwake]);
}
