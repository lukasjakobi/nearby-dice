import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';

import { useSettingsStore } from '@/store';

const TAG = 'session';

/** "Bildschirm anlassen": keeps the screen on in the lobby and during the game. */
export function useKeepAwakeSetting(): void {
  const keepAwake = useSettingsStore((s) => s.keepAwake);
  useEffect(() => {
    if (!keepAwake) return;
    void activateKeepAwakeAsync(TAG);

    return () => void deactivateKeepAwake(TAG);
  }, [keepAwake]);
}
