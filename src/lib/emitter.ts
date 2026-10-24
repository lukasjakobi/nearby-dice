export type Unsubscribe = () => void;

/** A tiny typed event emitter. `Events` maps event names to payload types. */
export class Emitter<Events extends Record<string, unknown>> {
  private listeners: { [E in keyof Events]?: Set<(payload: Events[E]) => void> } = {};

  on<E extends keyof Events>(event: E, listener: (payload: Events[E]) => void): Unsubscribe {
    const set = (this.listeners[event] ??= new Set());
    set.add(listener);

    return () => set.delete(listener);
  }

  emit<E extends keyof Events>(event: E, payload: Events[E]): void {
    for (const listener of [...(this.listeners[event] ?? [])]) listener(payload);
  }

  clear(): void {
    this.listeners = {};
  }
}

/** Observable value for `useSyncExternalStore`. */
export class Store<T> {
  private listeners = new Set<() => void>();
  constructor(private value: T) {}

  get = (): T => this.value;

  set(value: T): void {
    this.value = value;
    for (const listener of [...this.listeners]) listener();
  }

  update(fn: (value: T) => T): void {
    this.set(fn(this.value));
  }

  subscribe = (listener: () => void): Unsubscribe => {
    this.listeners.add(listener);

    return () => this.listeners.delete(listener);
  };
}
