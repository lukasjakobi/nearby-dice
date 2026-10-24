import { FakeNetwork } from '@/net/fake/FakeNetwork';
import { FakeTransport } from '@/net/fake/FakeTransport';

import { RoundScanner } from '../RoundScanner';

const missingLocation = new Error('8034: MISSING_PERMISSION_ACCESS_COARSE_LOCATION');

test('discovery permission failures reach waiters and clear the scanning state', async () => {
  const transport = new FakeTransport(new FakeNetwork());
  jest.spyOn(transport, 'startDiscovery').mockRejectedValue(missingLocation);
  const scanner = new RoundScanner(transport);
  const release = scanner.acquire();
  await expect(scanner.waitFor('ABCD', 50)).rejects.toBe(missingLocation);
  expect(scanner.state.get()).toMatchObject({ scanning: false, error: missingLocation });
  release();
});

test('a failed collision scan releases discovery, allowing a retry', async () => {
  const transport = new FakeTransport(new FakeNetwork());
  const start = jest.spyOn(transport, 'startDiscovery').mockRejectedValueOnce(missingLocation);
  const stop = jest.spyOn(transport, 'stopDiscovery');
  const scanner = new RoundScanner(transport);
  await expect(scanner.collectCodes(20)).rejects.toBe(missingLocation);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(stop).toHaveBeenCalledTimes(1);
  await expect(scanner.collectCodes(1)).resolves.toEqual(new Set());
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(start).toHaveBeenCalledTimes(2);
  expect(stop).toHaveBeenCalledTimes(2);
});

test('a late failure from a released scan does not overwrite a new scan', async () => {
  const transport = new FakeTransport(new FakeNetwork());
  let fail!: (error: Error) => void;
  jest.spyOn(transport, 'startDiscovery').mockImplementationOnce(
    () =>
      new Promise((_, reject) => {
        fail = reject;
      }),
  );
  const scanner = new RoundScanner(transport);
  const firstRelease = scanner.acquire();
  await Promise.resolve();
  firstRelease();
  const release = scanner.acquire();
  fail(missingLocation);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(scanner.state.get()).toMatchObject({ scanning: true, error: null });
  release();
});
