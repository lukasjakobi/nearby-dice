import { useEffect } from 'react';

import { startAppAudio } from '../audio';

/** Wait for persisted settings before creating any background music. */
export function useAppAudio(ready: boolean): void {
  useEffect(() => {
    if (ready) return startAppAudio();
  }, [ready]);
}
