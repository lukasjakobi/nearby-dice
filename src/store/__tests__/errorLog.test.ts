import AsyncStorage from '@react-native-async-storage/async-storage';

import { ERROR_LOG_LIMIT, toLoggedError, useErrorLogStore } from '../errorLog';

const KEY = 'nearbydice.errorLog.v1';

function rehydrate(): Promise<void> {
  return new Promise((resolve) => {
    const unsubscribe = useErrorLogStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
    void useErrorLogStore.persist.rehydrate();
  });
}

test('an error becomes its name, message and stacks', () => {
  const error = new TypeError('boom');

  expect(toLoggedError(error, { fatal: true, componentStack: '\n  in Game' }, 7)).toEqual({
    at: 7,
    message: 'TypeError: boom',
    stack: expect.stringContaining('TypeError: boom'),
    componentStack: 'in Game',
    fatal: true,
  });
});

test('a thrown value that is not an Error is kept as text', () => {
  expect(toLoggedError('lost', { fatal: false }, 7)).toMatchObject({
    message: 'lost',
    stack: null,
    componentStack: null,
  });
});

test('the log keeps the newest errors first and drops the oldest', () => {
  for (let i = 0; i <= ERROR_LOG_LIMIT; i++) {
    useErrorLogStore.getState().record(new Error(`error ${i}`), { fatal: false });
  }

  const { errors } = useErrorLogStore.getState();
  expect(errors).toHaveLength(ERROR_LOG_LIMIT);
  expect(errors[0]?.message).toBe(`Error: error ${ERROR_LOG_LIMIT}`);
  expect(errors.at(-1)?.message).toBe('Error: error 1');
});

test('hydration keeps well-formed entries and drops broken ones', async () => {
  const kept = { at: 1, message: 'Error: kept', stack: null, componentStack: null, fatal: true };
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify({ state: { errors: [kept, { at: -1, message: 'broken' }] }, version: 0 }),
  );

  await rehydrate();

  expect(useErrorLogStore.getState().errors).toEqual([kept]);
});
