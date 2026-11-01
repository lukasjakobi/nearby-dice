import { act, screen } from '@testing-library/react-native';

import { renderScreen } from '@/test/render';

import { TimerBar } from '../components/TimerBar';

afterEach(() => jest.useRealTimers());

test('shows the whole seconds left and drops by one on each second', async () => {
  jest.useFakeTimers({ now: 0 });
  await renderScreen(<TimerBar deadline={22_500} limitMs={30_000} lowMs={10_000} />);

  expect(screen.getByText('23')).toBeOnTheScreen();

  await act(() => jest.advanceTimersByTime(500));
  expect(screen.getByText('22')).toBeOnTheScreen();

  await act(() => jest.advanceTimersByTime(21_500));
  expect(screen.getByText('1')).toBeOnTheScreen();

  await act(() => jest.advanceTimersByTime(1_000));
  expect(screen.getByText('0')).toBeOnTheScreen();
});
