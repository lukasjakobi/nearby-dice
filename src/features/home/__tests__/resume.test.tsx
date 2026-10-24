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
import { useInterruptedStore } from '@/store/interrupted';
import { useProfileStore } from '@/store/profile';
import { ANTONIA, LUKAS } from '@/test/fixtures';
import { renderScreen } from '@/test/render';

import { HomeScreen } from '../HomeScreen';

jest.mock('@/net/createTransport', () => ({ getTransport: jest.fn() }));
jest.mock('@/session/activeSession', () => ({
  getRoundScanner: jest.fn(),
  setActiveSession: jest.fn(),
}));

/** Longer than the handshake on the fake network. */
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
  useProfileStore.setState({ profile: ANTONIA, onboardingDone: true });
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
  useInterruptedStore.setState({
    interrupted: {
      code: host.getSnapshot().shared.code,
      hostName: LUKAS.name,
      rejoinToken: 'token',
      round: 3,
      totalRounds: 13,
      otherPlayers: [],
      lastSeenAt: Date.now(),
    },
  });
});

afterEach(() => {
  host.dispose();
  jest.useRealTimers();
});

const linked = () => network.isLinked(guestTransport.id, hostTransport.id);

async function resumeUntilSuccess() {
  const view = await renderScreen(<HomeScreen />);
  await fireEvent.press(screen.getByText(t('home.resume.resume')));
  await act(async () => jest.advanceTimersByTimeAsync(HANDSHAKE_MS));
  expect(screen.getByText(t('home.resume.successTitle'))).toBeTruthy();
  expect(linked()).toBe(true);

  return view;
}

test('entering the game hands the resumed session over once', async () => {
  const view = await resumeUntilSuccess();

  await fireEvent.press(screen.getByText(t('home.resume.successAction')));
  await view.unmount();

  expect(setActiveSession).toHaveBeenCalledTimes(1);
  expect(setActiveSession).toHaveBeenCalledWith(expect.any(GuestSession));
  expect(router.push).toHaveBeenCalledWith('/game');
  expect(linked()).toBe(true);
  jest.mocked(setActiveSession).mock.calls[0]![0]!.dispose();
});

test('dismissing the sheet after success closes the resumed session', async () => {
  const view = await resumeUntilSuccess();

  const [sheet] = view.container.queryAll((node) => node.type === 'Modal' && node.props.visible);
  // Android Back on the open sheet.
  await fireEvent(sheet!, 'requestClose');
  await act(async () => jest.advanceTimersByTimeAsync(HANDSHAKE_MS));

  expect(setActiveSession).not.toHaveBeenCalled();
  expect(linked()).toBe(false);
  await view.unmount();
});

test('leaving Home after success closes the resumed session', async () => {
  const view = await resumeUntilSuccess();

  await view.unmount();
  await act(async () => jest.advanceTimersByTimeAsync(HANDSHAKE_MS));

  expect(setActiveSession).not.toHaveBeenCalled();
  expect(linked()).toBe(false);
});

test('leaving Home during the search leaves no session behind', async () => {
  const view = await renderScreen(<HomeScreen />);
  await fireEvent.press(screen.getByText(t('home.resume.resume')));

  await view.unmount();
  await act(async () => jest.advanceTimersByTimeAsync(HANDSHAKE_MS));

  expect(setActiveSession).not.toHaveBeenCalled();
  expect(linked()).toBe(false);
  expect(host.getSnapshot().shared.players).toHaveLength(1);
});
