import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { AppState, Platform } from 'react-native';

import { useSettingsStore } from '@/store';

export enum Sound {
  Roll = 'roll',
  Score = 'score',
  Join = 'join',
  Tap = 'tap',
  Hold = 'hold',
  Release = 'release',
  Turn = 'turn',
  Countdown = 'countdown',
  Start = 'start',
  Strike = 'strike',
  Yatzy = 'yatzy',
  Finish = 'finish',
}

const SOURCES: Record<Sound, number> = {
  [Sound.Roll]: require('../../assets/sounds/roll.wav'),
  [Sound.Score]: require('../../assets/sounds/score.wav'),
  [Sound.Join]: require('../../assets/sounds/join.wav'),
  [Sound.Tap]: require('../../assets/sounds/tap.wav'),
  [Sound.Hold]: require('../../assets/sounds/hold.wav'),
  [Sound.Release]: require('../../assets/sounds/release.wav'),
  [Sound.Turn]: require('../../assets/sounds/turn.wav'),
  [Sound.Countdown]: require('../../assets/sounds/countdown.wav'),
  [Sound.Start]: require('../../assets/sounds/start.wav'),
  [Sound.Strike]: require('../../assets/sounds/strike.wav'),
  [Sound.Yatzy]: require('../../assets/sounds/yatzy.wav'),
  [Sound.Finish]: require('../../assets/sounds/finish.wav'),
};
const MUSIC = require('../../assets/sounds/music.wav');
/** Music sits under the effects: full music volume is this loud. */
const MUSIC_MIX = 0.3;
type EffectPlayer = { player: AudioPlayer; request: number };
const effects = new Map<Sound, EffectPlayer>();

// iOS can report null briefly at launch, before the first AppState event.
const isForeground = () => AppState.currentState === null || AppState.currentState === 'active';

/** Reuse short effects; a pending seek must never play after mute/background/cleanup. */
export async function playSound(sound: Sound): Promise<void> {
  if (!useSettingsStore.getState().sound || !isForeground()) return;
  try {
    let effect = effects.get(sound);
    if (!effect) {
      effect = { player: createAudioPlayer(SOURCES[sound]), request: 0 };
      effects.set(sound, effect);
      effect.player.volume = useSettingsStore.getState().soundVolume;
      effect.player.play();

      return;
    }

    const request = ++effect.request;
    await effect.player.seekTo(0);
    if (
      effects.get(sound) === effect &&
      effect.request === request &&
      useSettingsStore.getState().sound &&
      isForeground()
    ) {
      effect.player.volume = useSettingsStore.getState().soundVolume;
      effect.player.play();
    }
  } catch {
    // Audio is decoration; loading or playback failure must never break a turn.
  }
}

function pauseEffects(): void {
  for (const effect of effects.values()) {
    effect.request++;
    try {
      effect.player.pause();
    } catch {
      // Keep stopping the other players if a native player was already released.
    }
  }
}

/** One root-owned music player across navigation, with independent persisted mute. */
export function startAppAudio(): () => void {
  let music: AudioPlayer | null = null;
  let configured = false;
  let disposed = false;

  const sync = () => {
    if (disposed) return;
    const settings = useSettingsStore.getState();
    const foreground = isForeground();
    if (!foreground || !settings.sound) pauseEffects();
    if (!configured) return;
    try {
      if (foreground && settings.music) {
        if (!music) {
          music = createAudioPlayer(MUSIC);
          music.loop = true;
        }

        music.volume = settings.musicVolume * MUSIC_MIX;
        if (!music.playing) music.play();
      } else {
        music?.pause();
      }
    } catch {
      // Settings and lifecycle changes still work if audio is unavailable.
    }
  };

  const unsubscribe = useSettingsStore.subscribe(sync);
  const subscription = AppState.addEventListener('change', sync);
  void setAudioModeAsync({
    // Android drops play() on vibrate/silent otherwise; game audio there follows media volume.
    // iOS keeps the mute switch.
    playsInSilentMode: Platform.OS === 'android',
    shouldPlayInBackground: false,
    interruptionMode: 'mixWithOthers',
  })
    .then(() => {
      configured = true;
      sync();
    })
    .catch(() => {
      // Do not fail app startup when the audio session cannot be configured.
    });

  return () => {
    disposed = true;
    unsubscribe();
    subscription.remove();
    pauseEffects();
    const players = [...effects.values()].map((effect) => effect.player);
    if (music) players.push(music);
    effects.clear();
    for (const player of players) {
      try {
        player.remove();
      } catch {
        // Continue releasing the remaining players.
      }
    }
  };
}
