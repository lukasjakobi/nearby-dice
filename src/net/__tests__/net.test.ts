import { PlayerColor } from '@/domain/player';

import { decodeAdvertisement, encodeAdvertisement, isFull } from '../advertisement';
import { FakeNetwork } from '../fake/FakeNetwork';
import { FakeTransport } from '../fake/FakeTransport';
import { ChunkAssembler, splitIntoChunks } from '../nearby/chunking';
import {
  ROUND_CODE_ALPHABET,
  generateRoundCode,
  isValidRoundCode,
  normalizeRoundCode,
} from '../roundCode';
import { TransportEvent } from '../transport';

describe('round code', () => {
  test('alphabet has 31 unambiguous symbols', () => {
    expect(ROUND_CODE_ALPHABET).toHaveLength(31);
    for (const confusing of '0O1IL') expect(ROUND_CODE_ALPHABET).not.toContain(confusing);
  });

  test('generated codes are valid', () => {
    for (let i = 0; i < 100; i++) expect(isValidRoundCode(generateRoundCode())).toBe(true);
  });

  test('input is normalised: case, junk, length', () => {
    expect(normalizeRoundCode('7k4m')).toBe('7K4M');
    expect(normalizeRoundCode(' 7-k 4m9 ')).toBe('7K4M');
    expect(normalizeRoundCode('O0I1')).toBe('');
    expect(isValidRoundCode('7K4M')).toBe(true);
  });
});

describe('advertisement', () => {
  const ad = {
    code: '7K4M',
    roundName: 'Antonias Runde',
    hostName: 'Antonia',
    hostColor: PlayerColor.Sky,
    players: 2,
    maxPlayers: 4,
  };

  test('round trips', () => {
    expect(decodeAdvertisement(encodeAdvertisement(ad))).toEqual(ad);
  });

  test('separators in names cannot break the format', () => {
    const tricky = { ...ad, roundName: 'A|B' };
    expect(decodeAdvertisement(encodeAdvertisement(tricky))?.roundName).toBe('A/B');
  });

  test('rejects foreign or broken names', () => {
    expect(decodeAdvertisement('some-other-app')).toBeNull();
    expect(decodeAdvertisement('v1|0000|2|4|sky|Antonia|R')).toBeNull();
    expect(decodeAdvertisement('v1|7K4M|2|4|purple|Antonia|R')).toBeNull();
  });

  test('full', () => {
    expect(isFull({ ...ad, players: 4 })).toBe(true);
  });
});

describe('chunking', () => {
  test('small messages pass through unchanged', () => {
    expect(splitIntoChunks('{"a":1}', 'x')).toEqual(['{"a":1}']);
  });

  test('large messages are split and reassembled, interleaved per sender', () => {
    const big = 'ä'.repeat(25_000);
    const chunks = splitIntoChunks(big, 'm1', 8000);
    expect(chunks).toHaveLength(4);
    const assembler = new ChunkAssembler();
    const results = [...chunks].reverse().map((c) => assembler.accept('peer', c));
    expect(results.slice(0, 3)).toEqual([null, null, null]);
    expect(results[3]).toBe(big);
  });
});

describe('fake network', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('discovery, connection and messages', async () => {
    const network = new FakeNetwork(10);
    const host = new FakeTransport(network);
    const guest = new FakeTransport(network);
    const found = jest.fn();
    const connected = jest.fn();
    const received = jest.fn();
    guest.on(TransportEvent.EndpointFound, found);
    host.on(TransportEvent.PeerConnected, connected);
    host.on(TransportEvent.Data, received);

    await host.startAdvertising({
      code: '7K4M',
      roundName: 'R',
      hostName: 'H',
      hostColor: PlayerColor.Amber,
      players: 1,
      maxPlayers: 4,
    });
    await guest.startDiscovery();
    jest.advanceTimersByTime(10);
    expect(found).toHaveBeenCalledWith(expect.objectContaining({ endpointId: host.id }));

    const connecting = guest.connect(host.id);
    jest.advanceTimersByTime(10);
    const connection = await connecting;
    expect(connected).toHaveBeenCalledWith({ peerId: guest.id, authToken: connection.authToken });

    await guest.send(connection.peerId, 'hello');
    jest.advanceTimersByTime(10);
    expect(received).toHaveBeenCalledWith({ peerId: guest.id, data: 'hello' });
  });

  test('an unreachable host cannot be connected', async () => {
    const network = new FakeNetwork(10);
    const host = new FakeTransport(network);
    const guest = new FakeTransport(network);
    await host.startAdvertising({
      code: '7K4M',
      roundName: 'R',
      hostName: 'H',
      hostColor: PlayerColor.Amber,
      players: 1,
      maxPlayers: 4,
    });
    network.makeUnreachable(host, 1000);
    const connecting = guest.connect(host.id);
    jest.advanceTimersByTime(10);
    await expect(connecting).rejects.toThrow();
  });
});
