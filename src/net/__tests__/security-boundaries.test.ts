import { Category } from '@/domain/enums';
import { LUKAS, ANTONIA, presetGame, snapshot } from '@/test/fixtures';
import { encode, decode, MessageType, PROTOCOL_VERSION } from '@/session/protocol';
import { SessionPhase } from '@/session/types';

import { ChunkAssembler, splitIntoChunks } from '../nearby/chunking';

describe('nearby chunk boundary', () => {
  test.each(['~', '~id:0:4294967296:x', '~id:x:2:x', '~id:0:2', '~id:2:2:x'])(
    'rejects malformed frame %s without throwing',
    (frame) => {
      expect(() => new ChunkAssembler().accept('peer', frame)).not.toThrow();
      expect(new ChunkAssembler().accept('peer', frame)).toBeNull();
    },
  );

  test('rejects inconsistent chunk counts and bounds pending data', () => {
    const assembler = new ChunkAssembler();
    expect(assembler.accept('peer', '~id:0:2:a')).toBeNull();
    expect(assembler.accept('peer', '~id:1:3:b')).toBeNull();
    for (let i = 0; i < 100; i++) assembler.accept(`peer-${i}`, `~m${i}:0:2:x`);
    expect(assembler.pendingCount).toBe(assembler.maxPendingMessages);
    expect(assembler.accept('peer-0', '~m0:1:2:y')).toBe('xy');
    const onePeer = new ChunkAssembler();
    for (let i = 0; i < 100; i++) onePeer.accept('peer', `~m${i}:0:2:x`);
    expect(onePeer.pendingCount).toBe(4);
  });

  test('valid chunks reassemble and disconnected senders are forgotten', () => {
    const data = 'x'.repeat(25_000);
    const assembler = new ChunkAssembler();
    const chunks = splitIntoChunks(data, 'message');
    expect(assembler.accept('peer', chunks[0])).toBeNull();
    assembler.forget('peer');
    expect(assembler.pendingCount).toBe(0);
    expect(chunks.map((chunk) => assembler.accept('peer', chunk)).at(-1)).toBe(data);
    const prefixed = splitIntoChunks('~small', 'single');
    expect(assembler.accept('peer', prefixed[0])).toBe('~small');
  });

  test('expires incomplete messages before accepting more data', () => {
    jest.useFakeTimers();
    try {
      const assembler = new ChunkAssembler();
      expect(assembler.accept('peer', '~old:0:2:a')).toBeNull();
      jest.advanceTimersByTime(31_000);
      expect(assembler.accept('peer', '~old:1:2:b')).toBeNull();
      expect(assembler.pendingCount).toBe(1);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('protocol runtime validation', () => {
  test.each([
    { type: MessageType.Hello, deviceId: 'device', profile: null, authToken: 'token' },
    { type: MessageType.Hold, held: null },
    { type: MessageType.State, shared: null },
    {
      type: MessageType.Hello,
      deviceId: 'device',
      profile: { name: 'A', color: 'purple' },
      authToken: 'token',
    },
    { type: MessageType.Hold, held: [false, false, false, false, 1] },
    { type: MessageType.Score, category: 'bogus', sheet: 0 },
  ])('rejects malformed $type message', (message) => {
    expect(decode(JSON.stringify({ v: PROTOCOL_VERSION, ...message }))).toBeNull();
  });

  test('rejects invalid nested state and accepts a complete valid game', () => {
    const validGame = presetGame([LUKAS, ANTONIA]);
    const shared = { ...snapshot({}).shared, game: validGame };
    const badShared = {
      ...shared,
      game: { ...validGame, turn: { ...validGame.turn, held: null } },
    };
    expect(decode(encode({ type: MessageType.State, shared: badShared } as never))).toBeNull();
    expect(decode(encode({ type: MessageType.State, shared }))).toEqual({
      type: MessageType.State,
      shared,
    });
  });

  test('accepts the real initial lobby Welcome shape', () => {
    const shared = snapshot({ phase: SessionPhase.Lobby, game: null }).shared;
    const lobby = { ...shared, gameNumber: 0 };
    const welcome = {
      type: MessageType.Welcome as const,
      playerId: ANTONIA.id,
      rejoinToken: 'rejoin-token',
      shared: lobby,
    };
    expect(decode(encode(welcome))).toEqual(welcome);
  });

  test('rejects invalid nested rules, players, dice and score values', () => {
    const validGame = presetGame([LUKAS, ANTONIA]);
    const shared = { ...snapshot({}).shared, game: validGame };
    const malformed = [
      { ...shared, preset: 'bogus' },
      { ...shared, game: { ...validGame, rules: { ...validGame.rules, rollsPerTurn: 99 } } },
      {
        ...shared,
        players: [{ ...shared.players[0], name: 'M'.repeat(200) }, ...shared.players.slice(1)],
      },
      {
        ...shared,
        game: { ...validGame, turn: { ...validGame.turn, dice: [1, 2, 3, 4, 99] } },
      },
      {
        ...shared,
        game: {
          ...validGame,
          players: validGame.players.map((player, index) =>
            index === 0
              ? {
                  ...player,
                  sheets: [
                    { ...player.sheets[0], fields: { ...player.sheets[0].fields, ones: -1 } },
                  ],
                }
              : player,
          ),
        },
      },
    ];
    for (const invalid of malformed) {
      expect(decode(encode({ type: MessageType.State, shared: invalid } as never))).toBeNull();
    }
  });

  test('accepts valid client messages and rejects unsafe numbers and enums', () => {
    expect(
      decode(encode({ type: MessageType.Hold, held: [true, false, false, true, false] })),
    ).not.toBeNull();
    expect(
      decode(
        JSON.stringify({ v: PROTOCOL_VERSION, type: 'ping', at: Number.MAX_SAFE_INTEGER + 1 }),
      ),
    ).toBeNull();
    expect(
      decode(JSON.stringify({ v: PROTOCOL_VERSION, type: 'reject', reason: 'unexpected' })),
    ).toBeNull();
    expect(
      decode(
        JSON.stringify({ v: PROTOCOL_VERSION, type: 'score', category: Category.Ones, sheet: -1 }),
      ),
    ).toBeNull();
  });
});
