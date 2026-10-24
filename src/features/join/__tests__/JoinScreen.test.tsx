import { act, fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { PresetId } from '@/domain/rules';
import { t } from '@/test/i18n';
import { getTransport } from '@/net/createTransport';
import { FakeNetwork } from '@/net/fake/FakeNetwork';
import { FakeTransport } from '@/net/fake/FakeTransport';
import { getRoundScanner, setActiveSession } from '@/session/activeSession';
import { GuestSession } from '@/session/GuestSession';
import { HostSession } from '@/session/HostSession';
import { RoundScanner } from '@/session/RoundScanner';
import { TIMING } from '@/session/timing';
import { useProfileStore } from '@/store/profile';
import { ANTONIA, LUKAS } from '@/test/fixtures';
import { renderScreen } from '@/test/render';

import { JoinScreen } from '../JoinScreen';

jest.mock('@/net/createTransport', () => ({ getTransport: jest.fn() }));
jest.mock('@/session/activeSession', () => ({
  getRoundScanner: jest.fn(),
  setActiveSession: jest.fn(),
}));

/** Longer than the handshake on the fake network, shorter than the success pause. */
const HANDSHAKE_MS = 300;

let network: FakeNetwork;
let hostTransport: FakeTransport;
let guestTransport: FakeTransport;
let host: HostSession;

beforeEach(async () => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  network = new FakeNetwork(10);
  hostTransport = new FakeTransport(network, 'host');
  guestTransport = new FakeTransport(network, 'guest');
  jest.mocked(getTransport).mockReturnValue(guestTransport);
  jest.mocked(getRoundScanner).mockReturnValue(new RoundScanner(guestTransport));
  useProfileStore.setState({ profile: ANTONIA });
  const opening = HostSession.open({
    transport: hostTransport,
    scanner: new RoundScanner(hostTransport),
    profile: LUKAS,
    roundName: 'Lukas’ Runde',
    preset: PresetId.Classic,
    maxPlayers: 4,
  });
  await jest.advanceTimersByTimeAsync(TIMING.codeCollisionScan);
  host = await opening;
});

afterEach(() => {
  host.dispose();
  jest.useRealTimers();
});

/** Joins the host's round and stops during the success pause. */
async function joinUntilSuccess() {
  const view = await renderScreen(<JoinScreen />);
  await fireEvent.changeText(
    screen.getByLabelText(t('join.codeLabel')),
    host.getSnapshot().shared.code,
  );
  await fireEvent.press(screen.getByText(t('join.join')));
  await act(async () => jest.advanceTimersByTimeAsync(HANDSHAKE_MS));
  expect(screen.getByText(t('join.successTitle'))).toBeTruthy();
  expect(network.isLinked(guestTransport.id, hostTransport.id)).toBe(true);

  return view;
}

test('after the success pause the joined session becomes active and the lobby opens', async () => {
  const view = await joinUntilSuccess();

  await act(async () => jest.advanceTimersByTimeAsync(2000));

  expect(setActiveSession).toHaveBeenCalledWith(expect.any(GuestSession));
  expect(router.replace).toHaveBeenCalledWith('/guest-lobby');
  expect(network.isLinked(guestTransport.id, hostTransport.id)).toBe(true);
  jest.mocked(setActiveSession).mock.calls[0]![0]!.dispose();
  await view.unmount();
});

test('going back during the success pause closes the joined session instead of navigating', async () => {
  const view = await joinUntilSuccess();

  await fireEvent.press(screen.getByLabelText(t('common.back')));
  await act(async () => jest.advanceTimersByTimeAsync(2000));

  expect(router.back).toHaveBeenCalledTimes(1);
  expect(setActiveSession).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
  expect(network.isLinked(guestTransport.id, hostTransport.id)).toBe(false);
  await view.unmount();
});

test('leaving the screen during the success pause closes the joined session', async () => {
  const view = await joinUntilSuccess();

  await view.unmount();
  await act(async () => jest.advanceTimersByTimeAsync(2000));

  expect(setActiveSession).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
  expect(network.isLinked(guestTransport.id, hostTransport.id)).toBe(false);
});
