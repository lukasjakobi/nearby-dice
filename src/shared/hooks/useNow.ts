import { useEffect, useState } from 'react';

/** Current time, re-rendering every `intervalMs` while `active`. */
export function useNow(intervalMs = 250, active = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs, active]);

  return now;
}
