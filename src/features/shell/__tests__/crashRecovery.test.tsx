import { act, fireEvent, renderHook, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { activeSession, setActiveSession } from '@/session/activeSession';
import type { AnySession } from '@/session';
import { useErrorLogStore } from '@/store';
import { renderScreen } from '@/test/render';

import { CrashBoundary } from '../components';
import { useUncaughtErrors } from '../hooks';

let broken = true;

function Board() {
  if (broken) throw new Error('board broke');

  return <Text>Spielfeld</Text>;
}

beforeEach(() => {
  broken = true;
  // React reports caught render errors on the console too.
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

test('a render crash shows the recovery screen and logs the error with its component stack', async () => {
  await renderScreen(
    <CrashBoundary>
      <Board />
    </CrashBoundary>,
  );

  expect(screen.getByText('Etwas ist schiefgelaufen')).toBeTruthy();
  const [logged] = useErrorLogStore.getState().errors;
  expect(logged).toMatchObject({ message: 'Error: board broke', fatal: true });
  expect(logged?.componentStack).toContain('Board');
});

test('trying again renders the screen once it works', async () => {
  await renderScreen(
    <CrashBoundary>
      <Board />
    </CrashBoundary>,
  );
  broken = false;

  await fireEvent.press(screen.getByRole('button', { name: 'Erneut versuchen' }));

  expect(screen.getByText('Spielfeld')).toBeTruthy();
});

test('going home leaves the session and returns to Start', async () => {
  const session = { dispose: jest.fn() } as unknown as AnySession;
  setActiveSession(session);
  await renderScreen(
    <CrashBoundary>
      <Board />
    </CrashBoundary>,
  );

  await fireEvent.press(screen.getByRole('button', { name: 'Zur Startseite' }));

  expect(session.dispose).toHaveBeenCalled();
  expect(activeSession.get()).toBeNull();
  expect(router.replace).toHaveBeenCalledWith('/');
});

describe('uncaught errors', () => {
  const previous = jest.fn();
  let original: ReturnType<typeof ErrorUtils.getGlobalHandler>;

  beforeEach(() => {
    original = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler(previous);
  });

  afterEach(() => ErrorUtils.setGlobalHandler(original));

  test('a non-fatal error is logged and passed on', async () => {
    const { result } = await renderHook(() => useUncaughtErrors());
    const error = new Error('timer threw');

    await act(() => ErrorUtils.getGlobalHandler()(error, false));

    expect(useErrorLogStore.getState().errors[0]).toMatchObject({ fatal: false });
    expect(previous).toHaveBeenCalledWith(error, false);
    expect(result.current.fatal).toBe(false);
  });

  test('a fatal error brings up the recovery screen until dismissed', async () => {
    const { result } = await renderHook(() => useUncaughtErrors());

    await act(() => ErrorUtils.getGlobalHandler()(new Error('radio threw'), true));

    expect(result.current.fatal).toBe(true);
    expect(useErrorLogStore.getState().errors[0]).toMatchObject({ fatal: true });

    await act(() => result.current.dismiss());

    expect(result.current.fatal).toBe(false);
  });

  test('unmounting restores the previous handler', async () => {
    const { unmount } = await renderHook(() => useUncaughtErrors());

    await unmount();

    expect(ErrorUtils.getGlobalHandler()).toBe(previous);
  });
});
