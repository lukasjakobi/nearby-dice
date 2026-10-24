import { useState } from 'react';

import { useProfileStore } from '@/store';
import { navigate, Route, useProfileForm } from '@/shared';

export enum OnboardingSlide {
  Dice = 0,
  Code = 1,
  Profile = 2,
}

const LAST = OnboardingSlide.Profile;

export function useOnboarding() {
  const [slide, setSlide] = useState(OnboardingSlide.Dice);
  const form = useProfileForm(null);
  const saveProfile = useProfileStore((s) => s.saveProfile);
  const completeOnboarding = useProfileStore((s) => s.completeOnboarding);

  const leave = () => {
    completeOnboarding();
    navigate.replace(Route.Home);
  };

  return {
    slide,
    isLast: slide === LAST,
    canGoBack: slide > OnboardingSlide.Dice,
    canSkip: slide < LAST,
    form,
    back: () => setSlide((s) => Math.max(OnboardingSlide.Dice, s - 1)),
    next: () => setSlide((s) => Math.min(LAST, s + 1)),
    /** "Überspringen": no profile; Start then shows the "Wer spielt hier?" card. */
    skip: leave,
    finish: () => {
      if (!form.valid) return;
      saveProfile(form.profile());
      leave();
    },
  };
}
