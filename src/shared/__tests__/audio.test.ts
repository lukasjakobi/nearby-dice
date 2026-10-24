import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';

import { useSettingsStore } from '@/store/settings';

import { playSound, Sound, startAppAudio } from '../audio';

let stop: (() => void) | undefined;
let changeState: (state: AppStateStatus) => void;
const initialAppState = AppState.currentState;

beforeAll(async () => {
  if (!useSettingsStore.persist.hasHydrated()) {
    await new Promise<void>((resolve) =>
      useSettingsStore.persist.onFinishHydration(() => resolve()),
    );
  }
});

beforeEach(() => {
  jest.clearAllMocks();
  AppState.currentState = 'active';
  useSettingsStore.setState({
    sound: true,
    music: false,
    haptics: true,
    soundVolume: 0.7,
    musicVolume: 0.7,
  });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    changeState = (state) => {
      AppState.currentState = state;
      listener(state);
    };

    return { remove: jest.fn() };
  });
});

afterEach(() => {
  // Also releases effect players in tests that do not start the app controller.
  (stop ?? startAppAudio())();
  stop = undefined;
  AppState.currentState = initialAppState;
  jest.restoreAllMocks();
});

const playerAt = (index: number) => jest.mocked(createAudioPlayer).mock.results[index]!.value;

test('music is opt-in, loops quietly, and stays independent of the effects switch', async () => {
  stop = startAppAudio();
  await Promise.resolve();
  expect(createAudioPlayer).not.toHaveBeenCalled();

  useSettingsStore.getState().toggle('music');
  const music = playerAt(0);
  expect(music.loop).toBe(true);
  expect(music.volume).toBeCloseTo(0.21);
  expect(music.play).toHaveBeenCalledTimes(1);

  music.playing = true;
  useSettingsStore.getState().toggle('sound');
  await playSound(Sound.Roll);
  expect(createAudioPlayer).toHaveBeenCalledTimes(1);
  expect(music.pause).not.toHaveBeenCalled();

  useSettingsStore.getState().toggle('music');
  expect(music.pause).toHaveBeenCalledTimes(1);
});

test('volume levels apply to the next effect and to playing music right away', async () => {
  useSettingsStore.setState({ music: true });
  stop = startAppAudio();
  await Promise.resolve();
  const music = playerAt(0);
  await playSound(Sound.Roll);
  const roll = playerAt(1);
  expect(roll.volume).toBe(0.7);

  useSettingsStore.getState().setVolume('music', 1);
  expect(music.volume).toBeCloseTo(0.3);

  useSettingsStore.getState().setVolume('sound', 0.33);
  await playSound(Sound.Roll);
  expect(roll.volume).toBe(0.3);
});

test('inactive and background states stop all audio; returning resumes only enabled music', async () => {
  useSettingsStore.setState({ music: true });
  stop = startAppAudio();
  await Promise.resolve();
  const music = playerAt(0);
  await playSound(Sound.Roll);
  const roll = playerAt(1);

  changeState('inactive');
  expect(music.pause).toHaveBeenCalledTimes(1);
  expect(roll.pause).toHaveBeenCalledTimes(1);
  await playSound(Sound.Turn);
  expect(createAudioPlayer).toHaveBeenCalledTimes(2);

  changeState('background');
  changeState('active');
  expect(music.play).toHaveBeenCalledTimes(2);
  expect(roll.play).toHaveBeenCalledTimes(1);

  changeState('background');
  useSettingsStore.setState({ music: false });
  changeState('active');
  expect(music.play).toHaveBeenCalledTimes(2);
});

test('replaying an effect waits for its seek instead of playing from its old position', async () => {
  await playSound(Sound.Tap);
  const tap = playerAt(0);
  let finishSeek!: () => void;
  tap.seekTo.mockImplementationOnce(() => new Promise<void>((resolve) => (finishSeek = resolve)));

  const replay = playSound(Sound.Tap);
  expect(tap.play).toHaveBeenCalledTimes(1);
  finishSeek();
  await replay;
  expect(tap.play).toHaveBeenCalledTimes(2);
  expect(createAudioPlayer).toHaveBeenCalledTimes(1);
});

test.each(['mute', 'background', 'cleanup'] as const)(
  '%s cancels an effect that is still seeking',
  async (action) => {
    stop = startAppAudio();
    await Promise.resolve();
    await playSound(Sound.Hold);
    const hold = playerAt(0);
    let finishSeek!: () => void;
    hold.seekTo.mockImplementationOnce(
      () => new Promise<void>((resolve) => (finishSeek = resolve)),
    );
    const replay = playSound(Sound.Hold);

    if (action === 'mute') {
      useSettingsStore.setState({ sound: false });
      useSettingsStore.setState({ sound: true });
    } else if (action === 'background') {
      changeState('background');
      changeState('active');
    } else {
      stop();
      stop = undefined;
    }

    finishSeek();
    await replay;
    expect(hold.play).toHaveBeenCalledTimes(1);
  },
);

test('muting music during audio configuration prevents a late start', async () => {
  let configured!: () => void;
  jest
    .mocked(setAudioModeAsync)
    .mockImplementationOnce(() => new Promise<void>((resolve) => (configured = resolve)));
  useSettingsStore.setState({ music: true });
  stop = startAppAudio();
  useSettingsStore.setState({ music: false });
  configured();
  await Promise.resolve();
  expect(createAudioPlayer).not.toHaveBeenCalled();
});

test('cleanup releases players and cannot be undone by pending audio configuration', async () => {
  let configured!: () => void;
  jest
    .mocked(setAudioModeAsync)
    .mockImplementationOnce(() => new Promise<void>((resolve) => (configured = resolve)));
  useSettingsStore.setState({ music: true });
  stop = startAppAudio();
  await playSound(Sound.Join);
  const join = playerAt(0);
  stop();
  stop = undefined;
  configured();
  await Promise.resolve();
  expect(join.remove).toHaveBeenCalledTimes(1);
  expect(createAudioPlayer).toHaveBeenCalledTimes(1);
});

test('native playback and configuration failures are contained', async () => {
  jest.mocked(setAudioModeAsync).mockRejectedValueOnce(new Error('audio session unavailable'));
  stop = startAppAudio();
  await Promise.resolve();
  await playSound(Sound.Score);
  const score = playerAt(0);
  score.seekTo.mockRejectedValueOnce(new Error('player unavailable'));
  await expect(playSound(Sound.Score)).resolves.toBeUndefined();
  expect(score.play).toHaveBeenCalledTimes(1);
});

test.each([
  ['android', true],
  ['ios', false],
] as const)('on %s, audio plays in silent mode: %s', (os, playsInSilentMode) => {
  const initialOS = Platform.OS;
  Platform.OS = os;
  try {
    stop = startAppAudio();
    expect(setAudioModeAsync).toHaveBeenCalledWith(expect.objectContaining({ playsInSilentMode }));
  } finally {
    Platform.OS = initialOS;
  }
});
