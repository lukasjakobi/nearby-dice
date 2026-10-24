import { useState } from 'react';

import { PresetId } from '@/domain';
import { setActiveSession, TrainingSession } from '@/session';
import { navigate, Route, useProfileOrGuest } from '@/shared';

export function useTrainingSetup() {
  const profile = useProfileOrGuest();
  const [preset, setPreset] = useState(PresetId.Classic);

  return {
    preset,
    choosePreset: setPreset,
    start: () => {
      setActiveSession(new TrainingSession({ profile, preset }));
      navigate.replace(Route.Game);
    },
    back: () => navigate.back(),
  };
}
