import type { HarnessParam } from './harness';

/** Phones get no harness options; the web build reads them in `harnessParams.web.ts`. */
export function harnessParam(_name: HarnessParam): string | null {
  return null;
}
