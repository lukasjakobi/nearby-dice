import { getRandomValues } from 'expo-crypto';

const ALPHANUMERIC = 'abcdefghijklmnopqrstuvwxyz0123456789';
/** Bytes from here on would favour the first letters of the alphabet. */
const UNBIASED_BYTES = 256 - (256 % ALPHANUMERIC.length);

/** Random id for players, sessions and chunks. Not cryptographically strong. */
export function randomId(length = 12, rng: () => number = Math.random): string {
  let id = '';
  for (let i = 0; i < length; i++) id += ALPHANUMERIC[Math.floor(rng() * ALPHANUMERIC.length)];

  return id;
}

/** Unguessable id for credentials (rejoin tokens, device IDs), from the platform's secure source. */
export function secureRandomId(length = 16): string {
  let id = '';
  while (id.length < length) {
    for (const byte of getRandomValues(new Uint8Array(length))) {
      if (byte < UNBIASED_BYTES) id += ALPHANUMERIC[byte % ALPHANUMERIC.length];
    }
  }

  return id.slice(0, length);
}
