import { ANTONIA, LUKAS } from '@/test/fixtures';

import { MissingPlayerError, requirePlayer } from '../player';

test('requirePlayer finds a seat by id', () => {
  expect(requirePlayer([LUKAS, ANTONIA], ANTONIA.id)).toBe(ANTONIA);
});

test('requirePlayer names the missing id instead of returning undefined', () => {
  const lookup = () => requirePlayer([LUKAS], ANTONIA.id);

  expect(lookup).toThrow(MissingPlayerError);
  expect(lookup).toThrow(`No player matches id ${ANTONIA.id}`);
});
