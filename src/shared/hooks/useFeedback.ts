import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';

import { useSettingsStore } from '@/store';

import { playSound, Sound } from '../audio';

export type Feedback = {
  roll: () => void;
  score: () => void;
  join: () => void;
  tap: () => void;
  hold: (held: boolean) => void;
  countdown: () => void;
  start: () => void;
  strike: () => void;
  yatzy: () => void;
  finish: () => void;
  /** It is my turn now: the phone may be lying on the table. */
  turn: () => void;
};

/**
 * Sounds and vibration, each respecting its switch in Settings. `vibrate: false` is for
 * other players' moves: the phone on the table only buzzes for my own.
 */
export function useFeedback({ vibrate = true }: { vibrate?: boolean } = {}): Feedback {
  const sound = useSettingsStore((s) => s.sound);
  const haptics = useSettingsStore((s) => s.haptics) && vibrate;

  return useMemo(
    () => ({
      roll: () => {
        if (sound) void playSound(Sound.Roll);
        if (haptics) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      },
      score: () => {
        if (sound) void playSound(Sound.Score);
        if (haptics) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      join: () => {
        if (sound) void playSound(Sound.Join);
      },
      tap: () => {
        if (sound) void playSound(Sound.Tap);
        if (haptics) void Haptics.selectionAsync();
      },
      hold: (held) => {
        if (sound) void playSound(held ? Sound.Hold : Sound.Release);
        if (haptics) void Haptics.selectionAsync();
      },
      countdown: () => {
        if (sound) void playSound(Sound.Countdown);
      },
      start: () => {
        if (sound) void playSound(Sound.Start);
      },
      strike: () => {
        if (sound) void playSound(Sound.Strike);
        if (haptics) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      },
      yatzy: () => {
        if (sound) void playSound(Sound.Yatzy);
        if (haptics) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      finish: () => {
        if (sound) void playSound(Sound.Finish);
        if (haptics) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      turn: () => {
        if (sound) void playSound(Sound.Turn);
        if (haptics) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      },
    }),
    [sound, haptics],
  );
}
