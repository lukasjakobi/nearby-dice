import AsyncStorage from '@react-native-async-storage/async-storage';

import { HarnessParam, harnessParam } from '@/lib';

import type { KeyValue } from './keyValue';

/** Starts empty and forgets everything on reload. */
function inMemory(): KeyValue {
  const values = new Map<string, string>();

  return {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => void values.set(key, value),
    removeItem: async (key) => void values.delete(key),
  };
}

function prefixed(prefix: string): KeyValue {
  return {
    getItem: (key) => AsyncStorage.getItem(prefix + key),
    setItem: (key, value) => AsyncStorage.setItem(prefix + key, value),
    removeItem: (key) => AsyncStorage.removeItem(prefix + key),
  };
}

/**
 * The browser harness plays several phones in one browser, whose tabs share localStorage. A tab
 * opened with `?as=<name>` keeps its data under that name; a scenario starts empty every time.
 */
function forThisTab(): KeyValue {
  if (harnessParam(HarnessParam.Scenario)) return inMemory();
  const player = harnessParam(HarnessParam.As);

  return player ? prefixed(`${player}:`) : AsyncStorage;
}

export const keyValue = forThisTab();
