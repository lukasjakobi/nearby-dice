import { PlayerColor } from '@/domain/player';
import { FakeNetwork } from '@/net/fake/FakeNetwork';
import { FakeTransport } from '@/net/fake/FakeTransport';
import { TransportEvent } from '@/net/transport';

import { RoundScanner } from '../RoundScanner';
import { TIMING } from '../timing';

jest.useFakeTimers();

test('an empty search finishes loading after three seconds', async () => {
  const scanner = new RoundScanner(new FakeTransport(new FakeNetwork()));
  const release = scanner.acquire();
  try {
    await jest.advanceTimersByTimeAsync(2999);
    expect(scanner.state.get().scanning).toBe(true);
    await jest.advanceTimersByTimeAsync(1);
    expect(scanner.state.get()).toEqual({ rounds: [], scanning: false, error: null });
  } finally {
    release();
    await jest.advanceTimersByTimeAsync(0);
  }
});

test('refresh replaces stale rounds with fresh advertisements and retains scanner users', async () => {
  const network = new FakeNetwork();
  const host = new FakeTransport(network);
  const guest = new FakeTransport(network);
  const scanner = new RoundScanner(guest);
  const advertisement = {
    code: '7K4M',
    roundName: 'Spieleabend',
    hostName: 'Lukas',
    hostColor: PlayerColor.Amber,
    players: 1,
    maxPlayers: 4,
  };
  await host.startAdvertising(advertisement);
  const releaseFirst = scanner.acquire();
  const releaseSecond = scanner.acquire();
  await jest.advanceTimersByTimeAsync(TIMING.scanWindow);
  guest.receive(TransportEvent.EndpointFound, { endpointId: 'stale', advertisement });
  expect(scanner.state.get().rounds).toHaveLength(2);

  scanner.refresh();
  expect(scanner.state.get()).toEqual({ rounds: [], scanning: true, error: null });
  await jest.advanceTimersByTimeAsync(network.latencyMs);
  expect(scanner.state.get().rounds.map((round) => round.endpointId)).toEqual([host.id]);

  releaseFirst();
  await host.startAdvertising({ ...advertisement, players: 2 });
  await jest.advanceTimersByTimeAsync(network.latencyMs);
  expect(scanner.state.get().rounds[0].advertisement.players).toBe(2);
  releaseSecond();
  await jest.advanceTimersByTimeAsync(0);
  expect(scanner.state.get()).toEqual({ rounds: [], scanning: false, error: null });
});

test('refresh waits for native stop to finish, including when the screen leaves', async () => {
  const transport = new FakeTransport(new FakeNetwork());
  const scanner = new RoundScanner(transport);
  const start = jest.spyOn(transport, 'startDiscovery');
  let finishStop!: () => void;
  jest.spyOn(transport, 'stopDiscovery').mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finishStop = resolve;
      }),
  );
  const release = scanner.acquire();
  await jest.advanceTimersByTimeAsync(TIMING.scanWindow);
  scanner.refresh();
  await jest.advanceTimersByTimeAsync(0);
  expect(start).toHaveBeenCalledTimes(1);
  release();
  finishStop();
  await jest.advanceTimersByTimeAsync(0);
  expect(scanner.state.get()).toEqual({ rounds: [], scanning: false, error: null });
  const afterRelease = jest.spyOn(transport, 'stopDiscovery');
  expect(afterRelease).toHaveBeenCalledTimes(2);
});
