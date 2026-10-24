import { persistedStores } from '@/store/createPersistedStore';

/** Puts every persisted store back to its defaults, so no test sees another test's data. */
export function resetStores(): void {
  persistedStores.forEach((store) => store.reset());
}
