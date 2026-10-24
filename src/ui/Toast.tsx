import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeIn } from './FadeIn';
import { Text, TextVariant } from './Text';
import { useTheme } from './theme/ThemeProvider';

const TOAST_MS = 3200;
/** Distance from the bottom edge when no screen asks for another. */
export const DEFAULT_TOAST_OFFSET = 110;

type ToastApi = {
  show: (message: string) => void;
  /** Distance from the bottom edge, so toasts float above action bars. */
  setOffset: (offset: number) => void;
};

const ToastContext = createContext<ToastApi>({ show: () => {}, setOffset: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<{ id: number; text: string } | null>(null);
  const [offset, setOffset] = useState(DEFAULT_TOAST_OFFSET);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage({ id: Date.now(), text });
    timer.current = setTimeout(() => setMessage(null), TOAST_MS);
  }, []);
  const api = useMemo(() => ({ show, setOffset }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {message ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 20, right: 20, bottom: offset + insets.bottom }}
        >
          <FadeIn key={message.id}>
            <View
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={{
                backgroundColor: colors.ink,
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 16,
              }}
            >
              <Text variant={TextVariant.Body} size={14} color="bg">
                {message.text}
              </Text>
            </View>
          </FadeIn>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  return useContext(ToastContext);
}
