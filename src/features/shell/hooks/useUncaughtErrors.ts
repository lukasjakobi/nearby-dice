import { useEffect, useState } from 'react';

import { useErrorLogStore } from '@/store';

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;
type ErrorUtilsApi = {
  getGlobalHandler: () => GlobalHandler;
  setGlobalHandler: (handler: GlobalHandler) => void;
};

/** React Native's catcher for errors nothing else caught; the browser harness has none. */
const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsApi }).ErrorUtils;

/**
 * Logs errors thrown outside rendering, such as in session timers or radio callbacks. A fatal one
 * shows the recovery screen: release builds would otherwise close the app. Development builds
 * also pass every error on to React Native's own handler, which shows it in LogBox.
 */
export function useUncaughtErrors() {
  const record = useErrorLogStore((s) => s.record);
  const [fatal, setFatal] = useState(false);

  useEffect(() => {
    if (!errorUtils) return;
    const previous = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error, isFatal) => {
      record(error, { fatal: isFatal === true });
      if (isFatal) setFatal(true);
      if (!isFatal || __DEV__) previous(error, isFatal);
    });

    return () => errorUtils.setGlobalHandler(previous);
  }, [record]);

  return { fatal, dismiss: () => setFatal(false) };
}
