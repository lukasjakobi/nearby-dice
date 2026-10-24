export class AbortedError extends Error {
  constructor() {
    super('Aborted');
  }
}

export class TimeoutError extends Error {
  constructor() {
    super('Timed out');
  }
}

/** Resolves after `ms`; rejects with `AbortedError` when the signal fires. */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new AbortedError());
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new AbortedError());
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Rejects with `TimeoutError` if `promise` does not settle within `ms`. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** Collects timers so a class can cancel all of them in one call. */
export class Timers {
  private handles = new Set<ReturnType<typeof setTimeout>>();

  after(ms: number, fn: () => void): () => void {
    const handle = setTimeout(() => {
      this.handles.delete(handle);
      fn();
    }, ms);
    this.handles.add(handle);

    return () => {
      clearTimeout(handle);
      this.handles.delete(handle);
    };
  }

  every(ms: number, fn: () => void): () => void {
    const handle = setInterval(fn, ms);
    this.handles.add(handle);

    return () => {
      clearInterval(handle);
      this.handles.delete(handle);
    };
  }

  clearAll(): void {
    for (const handle of this.handles) {
      clearTimeout(handle);
      clearInterval(handle);
    }

    this.handles.clear();
  }
}
