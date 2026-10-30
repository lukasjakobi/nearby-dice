import { act, screen } from '@testing-library/react-native';
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

test('the grip claims a touch immediately and a long drag closes the sheet', async () => {
  const onClose = jest.fn();
  await renderScreen(
    <BottomSheet visible onClose={onClose} title="Regeln">
      <Text>Inhalt</Text>
    </BottomSheet>,
  );
  const grip = screen.getByTestId('bottom-sheet-handle');
  expect(grip.props.onStartShouldSetResponder()).toBe(true);
  const event = (pageY: number, timestamp: number) => ({
    nativeEvent: { pageX: 100, pageY, timestamp },
  });
  await act(() => {
    grip.props.onStartShouldSetResponderCapture(event(100, 0));
    grip.props.onResponderGrant(event(100, 0));
    grip.props.onResponderMove(event(1000, 1000));
    grip.props.onResponderRelease(event(1000, 1200));
  });
  expect(onClose).toHaveBeenCalledTimes(1);
});
