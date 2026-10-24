import { Category } from '@/domain/enums';
import { PlayerColor } from '@/domain/player';
import { seededRng } from '@/domain/random';
import { PresetId } from '@/domain/rules';
import { FakeNetwork } from '@/net/fake/FakeNetwork';
import { FakeTransport } from '@/net/fake/FakeTransport';

import { GuestSession } from '../GuestSession';
import { HostSession } from '../HostSession';
import { MessageType, decode, encode } from '../protocol';
import { isSharedSession } from '../protocolValidation';
import { RoundScanner } from '../RoundScanner';
import { TrainingSession } from '../TrainingSession';
import { TIMING } from '../timing';
import type { SessionController } from '../types';

jest.useFakeTimers();

const run = (ms: number) => jest.advanceTimersByTimeAsync(ms);

/** Starts a promise and advances fake time until it settles. */
async function settle<T>(promise: Promise<T>, maxMs = 30_000): Promise<T> {
  let done = false;
  const outcome = promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  void outcome.then(() => (done = true));
  for (let t = 0; t < maxMs && !done; t += 50) await run(50);
  const result = await outcome;
  if (!result.ok) throw result.error;

  return result.value;
}

function phone(network: FakeNetwork, name: string) {
  const transport = new FakeTransport(network, name);

  return { transport, scanner: new RoundScanner(transport) };
}

async function tripleGame() {
  const network = new FakeNetwork(10);
  const host = await settle(
    HostSession.open({
      ...phone(network, 'Lukas'),
      profile: { name: 'Lukas', color: PlayerColor.Amber },
      roundName: 'Lukas Runde',
      preset: PresetId.Triple,
      rng: seededRng(7),
    }),
  );
  const code = host.getSnapshot().shared.code;
  const guests: GuestSession[] = [];
  for (const name of ['Antonia', 'Jonas']) {
    guests.push(
      await settle(
        GuestSession.join({
          ...phone(network, name),
          deviceId: `device-${name}`,
          profile: { name, color: PlayerColor.Sky },
          code,
        }),
      ),
    );
  }

  await run(100);
  host.start();
  await run(3600);
  const phones: SessionController[] = [host, ...guests];
  const turnId = host.getSnapshot().shared.game!.turn.playerId;
  const active = phones.find((p) => p.getSnapshot().myId === turnId)!;
  const others = phones.filter((p) => p !== active);
  const pages = () => phones.map((p) => p.getSnapshot().shared.game!.turn.page);

  return { host, phones, active, others, pages };
}

describe('the open sheet is shared live', () => {
  test("every phone follows the active player's tab", async () => {
    const { phones, active, pages } = await tripleGame();
    expect(pages()).toEqual(phones.map(() => 0));

    active.viewSheet(2);
    await run(200);
    expect(pages()).toEqual(phones.map(() => 2));

    // Selecting a field on another sheet opens that sheet everywhere too.
    active.roll();
    await run(200);
    active.focus({ category: Category.Chance, sheet: 1 });
    await run(200);
    expect(pages()).toEqual(phones.map(() => 1));
  });

  test('the others cannot turn the page', async () => {
    const { phones, others, pages } = await tripleGame();
    for (const other of others) other.viewSheet(1);
    await run(200);
    expect(pages()).toEqual(phones.map(() => 0));
  });
});

describe('protocol', () => {
  test('"view-sheet" carries a sheet index within three sheets', () => {
    const message = { type: MessageType.ViewSheet, sheet: 2 } as const;
    expect(decode(encode(message))).toEqual(message);
    expect(decode(JSON.stringify({ v: 1, type: MessageType.ViewSheet }))).toBeNull();
    expect(decode(JSON.stringify({ v: 1, type: MessageType.ViewSheet, sheet: 3 }))).toBeNull();
    expect(decode(JSON.stringify({ v: 1, type: MessageType.ViewSheet, sheet: '1' }))).toBeNull();
  });

  test('a state without the page (older host) is still accepted; a bad one is not', async () => {
    const { host } = await tripleGame();
    const shared = host.getSnapshot().shared;
    const game = shared.game!;
    const { page: _page, ...turn } = game.turn;
    const withTurn = (t: object) => ({ ...shared, game: { ...game, turn: t } });
    expect(isSharedSession(shared)).toBe(true);
    expect(isSharedSession(withTurn(turn))).toBe(true);
    expect(isSharedSession(withTurn({ ...turn, page: 2 }))).toBe(true);
    expect(isSharedSession(withTurn({ ...turn, page: 3 }))).toBe(false);
    expect(isSharedSession(withTurn({ ...turn, page: null }))).toBe(false);
  });
});

test('training keeps the page in its own game', () => {
  const session = new TrainingSession({
    profile: { name: 'Lukas', color: PlayerColor.Amber },
    preset: PresetId.Triple,
    rng: seededRng(7),
  });
  jest.advanceTimersByTime(TIMING.trainingCountdown + 100);
  session.viewSheet(1);
  expect(session.getSnapshot().shared.game!.turn.page).toBe(1);
  session.viewSheet(5);
  expect(session.getSnapshot().shared.game!.turn.page).toBe(1);
  session.dispose();
});
