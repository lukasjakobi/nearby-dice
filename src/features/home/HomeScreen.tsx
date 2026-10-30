import { useProfileStore } from '@/store';
import { RedirectTo, Route } from '@/shared';

import { HomeContent } from './components';
import { useHome } from './hooks';

export function HomeScreen() {
  const onboardingDone = useProfileStore((s) => s.onboardingDone);
  const home = useHome();

  return onboardingDone ? <HomeContent home={home} /> : <RedirectTo route={Route.Onboarding} />;
}
