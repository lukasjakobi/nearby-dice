import * as Crypto from 'expo-crypto';

import { secureRandomId } from '../ids';

describe('secureRandomId', () => {
  afterEach(() => jest.restoreAllMocks());

  test('draws from the secure source and skips bytes that would bias the alphabet', () => {
    const batches = [
      [252, 0, 35, 255],
      [36, 71, 9, 1],
    ];
    const random = jest.spyOn(Crypto, 'getRandomValues').mockImplementation((array) => {
      array.set(batches.shift()!);

      return array;
    });

    expect(secureRandomId(4)).toBe('a9a9');
    expect(random).toHaveBeenCalledTimes(2);
  });

  test('returns distinct alphanumeric ids of the requested length', () => {
    const ids = Array.from({ length: 50 }, () => secureRandomId(16));
    expect(ids.every((id) => /^[a-z0-9]{16}$/.test(id))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
