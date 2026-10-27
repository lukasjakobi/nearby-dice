import type { ComponentType } from 'react';

import { AppShell } from '@/features/shell';

/**
 * Dev builds also run the browser harness's scenarios. The `require` sits behind `__DEV__` so
 * release bundles drop `@/dev` entirely; CI checks that (docs/technical-design.md, Browser harness).
 */
const ScenarioRunner: ComponentType | null = __DEV__
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('@/dev') as typeof import('@/dev')).ScenarioRunner
  : null;

export default function RootLayout() {
  return (
    <>
      <AppShell />
      {ScenarioRunner && <ScenarioRunner />}
    </>
  );
}
