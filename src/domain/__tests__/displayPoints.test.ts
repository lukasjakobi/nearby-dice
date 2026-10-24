import { sheetFactor } from '../scoring';

test('sheet factors ×1, ×2, ×3; 1 outside the known sheets', () => {
  expect([0, 1, 2].map(sheetFactor)).toEqual([1, 2, 3]);
  expect(sheetFactor(3)).toBe(1);
});
