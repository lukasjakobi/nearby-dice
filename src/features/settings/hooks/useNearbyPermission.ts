import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AppState } from 'react-native';

import { getTransport, PermissionStatus } from '@/net';

/** Re-reads the nearby permission when the screen gains focus and when the app returns. */
export function useNearbyPermission(): PermissionStatus | null {
  const [status, setStatus] = useState<PermissionStatus | null>(null);
  useFocusEffect(
    useCallback(() => {
      const read = () => void getTransport().getPermission().then(setStatus);
      read();
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') read();
      });

      return () => subscription.remove();
    }, []),
  );

  return status;
}
