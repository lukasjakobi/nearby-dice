import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ToastBanner } from './ToastBanner';

const TOAST_MS = 3200;

type ToastApi = {
  show: (message: string) => void;
};

type ToastState = { id: number; text: string; visible: boolean };

const ToastContext = createContext<ToastApi>({ show: () => {} });

/** Shows one toast at a time, just below the status bar, so no screen's action bar covers it. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), text, visible: true });
    timer.current = setTimeout(
      () => setToast((current) => current && { ...current, visible: false }),
      TOAST_MS,
    );
  }, []);
  const removeToast = useCallback(() => setToast(null), []);
  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: insets.top + 8,
            left: 16,
            right: 16,
            alignItems: 'center',
          }}
        >
          <ToastBanner
            key={toast.id}
            message={toast.text}
            visible={toast.visible}
            onExited={removeToast}
          />
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  return useContext(ToastContext);
}
