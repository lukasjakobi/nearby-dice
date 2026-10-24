import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createValidatedStorage } from './storage';
import type { Migrate, Sanitize } from './storage';

/** Changes the stored data; returning `data` itself changes nothing and writes nothing. */
type Update<D> = (change: (data: D) => Partial<D>) => void;

type Options<D extends object, A extends object> = {
  /** The AsyncStorage key. It never changes, or the data already on phones is lost. */
  key: string;
  /** Raised together with `migrate` when the stored shape changes. */
  version?: number;
  /** The data a new installation starts with; its keys are the fields that are stored. */
  defaults: D;
  sanitize: Sanitize<D>;
  migrate?: Migrate;
  actions: (update: Update<D>) => A;
};

/** What the app shell and the tests need from every persisted store. */
type PersistedStore = {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (listener: () => void) => () => void;
  };
  /** Back to `defaults`, for tests. */
  reset: () => void;
};

export const persistedStores: PersistedStore[] = [];

/** A zustand store whose data fields are saved to AsyncStorage through `createValidatedStorage`. */
export function createPersistedStore<D extends object, A extends object>({
  key,
  version = 0,
  defaults,
  sanitize,
  migrate,
  actions,
}: Options<D, A>) {
  const fields = Object.keys(defaults) as (keyof D)[];
  const store = create<D & A>()(
    persist(
      (set, get) => ({
        ...defaults,
        ...actions((change) => {
          const data = get();
          const next = change(data);
          if (next !== data) set(next as Partial<D & A>);
        }),
      }),
      {
        name: key,
        version,
        storage: createValidatedStorage<D>({ version, sanitize, migrate }),
        partialize: (state) =>
          Object.fromEntries(fields.map((field) => [field, state[field]])) as D,
      },
    ),
  );
  persistedStores.push({
    persist: store.persist,
    reset: () => store.setState(store.getInitialState(), true),
  });

  return store;
}
