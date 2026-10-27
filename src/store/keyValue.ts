import AsyncStorage from '@react-native-async-storage/async-storage';

/** What the persisted stores need from a key-value store. */
export type KeyValue = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

/** Where the persisted stores keep their data. The web build has its own (`keyValue.web.ts`). */
export const keyValue: KeyValue = AsyncStorage;
