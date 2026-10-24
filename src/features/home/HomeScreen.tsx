import { useProfileStore } from '@/store';
import { RedirectTo, Route } from '@/shared';

import { HomeContent } from './components';

export function HomeScreen() {
  const onboardingDone = useProfileStore((s) => s.onboardingDone);

  return onboardingDone ? <HomeContent /> : <RedirectTo route={Route.Onboarding} />;
}
