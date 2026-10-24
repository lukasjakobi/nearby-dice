import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store';

import type { SwitchKey, SwitchRow } from '../components/SwitchList';
import { useFeedback } from './useFeedback';

export type FeedbackSwitches = {
  rows: SwitchRow[];
  toggle: (key: SwitchKey) => void;
  setVolume: (key: SwitchKey, value: number) => void;
};

/** Sound, music and vibration switches with volume levels, shared by Settings, the lobbies and the game menu. */
export function useFeedbackSwitches(): FeedbackSwitches {
  const { t } = useTranslation();
  const sound = useSettingsStore((s) => s.sound);
  const music = useSettingsStore((s) => s.music);
  const haptics = useSettingsStore((s) => s.haptics);
  const soundVolume = useSettingsStore((s) => s.soundVolume);
  const musicVolume = useSettingsStore((s) => s.musicVolume);
  const toggle = useSettingsStore((s) => s.toggle);
  const storeVolume = useSettingsStore((s) => s.setVolume);
  const feedback = useFeedback();

  return {
    rows: [
      { key: 'sound', label: t('settings.sound'), value: sound, volume: soundVolume },
      { key: 'music', label: t('settings.music'), value: music, volume: musicVolume },
      { key: 'haptics', label: t('settings.haptics'), value: haptics },
    ],
    toggle,
    setVolume: (key, value) => {
      if (key !== 'sound' && key !== 'music') return;
      storeVolume(key, value);
      // Music is audible while dragging; effects get a tick at each new level.
      if (key === 'sound') feedback.tap();
    },
  };
}
