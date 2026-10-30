import { screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { renderScreen } from '@/test/render';

import { BottomSheet, closesOnRelease } from '../BottomSheet';

test.each([
  ['a short drag springs back', 120, 0.2, false],
  ['a drag past half the height closes', 260, 0.2, true],
  ['a fast flick closes however short', 40, 1.2, true],
  ['a fast flick upwards stays open', -40, -1.2, false],
  ['a fast flick within the slop stays open', 3, 1.2, false],
])('%s', (_, dy, vy, closes) => {
  expect(closesOnRelease(dy, vy, 500)).toBe(closes);
});

test('the sheet shows a drag handle above its title', async () => {
  await renderScreen(
    <BottomSheet visible onClose={() => {}} title="Regeln">
      <Text>Inhalt</Text>
    </BottomSheet>,
  );

  expect(screen.getByTestId('bottom-sheet-handle')).toBeOnTheScreen();
  expect(screen.getByRole('header', { name: 'Regeln' })).toBeOnTheScreen();
});
