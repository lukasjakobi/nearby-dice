import { Redirect } from 'expo-router';

import { href } from './routes';
import type { Route } from './routes';

/** Declarative redirect to a `Route` (e.g. Start → Onboarding on first launch). */
export function RedirectTo({ route }: { route: Route }) {
  return <Redirect href={href(route)} />;
}
