/**
 * Dev-only tooling: the bots that tests and scenarios play with, and the browser harness's
 * scenarios. Release bundles leave this module out (see `src/app/_layout.tsx`).
 */
export { BotPlayer } from './BotPlayer';
export { botMove } from './botMove';
export { ScenarioRunner } from './ScenarioRunner';
