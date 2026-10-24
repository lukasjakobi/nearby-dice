import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersistStorage, StorageValue } from 'zustand/middleware';

import { isRecord } from '@/domain';

/** Keeps the known good fields of a stored state and drops the rest. */
export type Sanitize<D> = (stored: Record<string, unknown>) => Partial<D>;
/** Brings a state stored by an older `version` to the current shape; `sanitize` runs after it. */
export type Migrate = (stored: Record<string, unknown>, version: number) => Record<string, unknown>;

type Envelope = { state: Record<string, unknown>; version: number };

export const nonNegative = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

function parseEnvelope(raw: string): Envelope | null {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || !isRecord(parsed.state)) return null;

  return { state: parsed.state, version: typeof parsed.version === 'number' ? parsed.version : 0 };
}

/** Deep equality for parsed JSON; key order does not matter. */
function sameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => sameJson(item, b[i]));
  }

  if (isRecord(a) && isRecord(b)) {
    const keys = Object.keys(a);

    return (
      keys.length === Object.keys(b).length &&
      keys.every((key) => Object.prototype.hasOwnProperty.call(b, key) && sameJson(a[key], b[key]))
    );
  }

  return false;
}

/** Copies `raw` to a `.corrupt.` key; true once the copy is on disk. */
async function backUp(name: string, raw: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(`${name}.corrupt.${Date.now()}`, raw);

    return true;
  } catch {
    return false;
  }
}

type Options<D> = { version: number; sanitize: Sanitize<D>; migrate?: Migrate };

/**
 * Persistence for one store. Stored data is overwritten only once a copy of it exists:
 * - A stored state that `migrate` or `sanitize` changes is first copied to a `.corrupt.` key,
 *   then the cleaned state is written back, so the copy is made once.
 * - A failed read starts the store from its defaults and blocks writes until a read succeeds,
 *   so the defaults never replace data that is still on disk.
 * Writes are best effort.
 */
export function createValidatedStorage<D>({
  version,
  sanitize,
  migrate,
}: Options<D>): PersistStorage<D> {
  let writesBlocked = false;

  async function write(name: string, value: StorageValue<D>): Promise<void> {
    if (writesBlocked) return;
    try {
      await AsyncStorage.setItem(name, JSON.stringify(value));
    } catch {
      // Persistence is best effort; an unavailable disk must not break interaction.
    }
  }

  function load(raw: string): { stored: Envelope; state: Partial<D> } | null {
    try {
      const stored = parseEnvelope(raw);
      if (!stored) return null;
      const current =
        stored.version === version || !migrate
          ? stored.state
          : migrate(stored.state, stored.version);

      return { stored, state: sanitize(current) };
    } catch {
      return null;
    }
  }

  return {
    async getItem(name) {
      let raw: string | null;
      try {
        raw = await AsyncStorage.getItem(name);
      } catch {
        writesBlocked = true;

        return null;
      }

      writesBlocked = false;
      if (raw === null) return null;
      const loaded = load(raw);
      if (!loaded) {
        if (await backUp(name, raw)) await AsyncStorage.removeItem(name).catch(() => {});
        else writesBlocked = true;

        return null;
      }

      // Zustand fills the fields `sanitize` dropped from the store's defaults.
      const value: StorageValue<D> = { state: loaded.state as D, version };
      if (loaded.stored.version !== version || !sameJson(loaded.stored.state, loaded.state)) {
        if (await backUp(name, raw)) await write(name, value);
        else writesBlocked = true;
      }

      return value;
    },
    setItem: write,
    async removeItem(name) {
      if (writesBlocked) return;
      try {
        await AsyncStorage.removeItem(name);
      } catch {
        // Clearing local history must remain usable if storage is unavailable.
      }
    },
  };
}
