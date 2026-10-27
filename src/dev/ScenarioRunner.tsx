import { useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { HarnessParam, harnessParam } from '@/lib';
import { useStoresHydrated } from '@/store';

import { isScenario, Scenario } from './scenario';
import { runScenario } from './scenarios';

/** What the page reports on `<html data-scenario>`; the harness waits for `ready`. */
export enum ScenarioStatus {
  Running = 'running',
  Ready = 'ready',
  Failed = 'failed',
}

const DEFAULT_SEED = 1;

// react-native-svg hands `accessible` to the DOM, and React reports it on every web screen; its
// toast would cover the bottom of every harness screenshot. LogBox's ignore list misses it on web.
if (Platform.OS === 'web') {
  const logError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (String(args[0]).includes('for a non-boolean attribute')) return;
    logError(...args);
  };
}

function report(status: ScenarioStatus, detail?: string): void {
  const root = globalThis.document?.documentElement;
  if (!root) return;
  root.dataset.scenario = status;
  if (detail) root.dataset.scenarioError = detail;
}

/** Starts the `?scenario=` once the stores and the router are ready. Renders nothing. */
export function ScenarioRunner() {
  const hydrated = useStoresHydrated();
  const routerReady = Boolean(useRootNavigationState()?.key);
  const started = useRef(false);

  useEffect(() => {
    const requested = harnessParam(HarnessParam.Scenario);
    if (!requested || !hydrated || !routerReady || started.current) return;
    started.current = true;
    if (!isScenario(requested)) {
      report(
        ScenarioStatus.Failed,
        `Unknown scenario; known: ${Object.values(Scenario).join(', ')}`,
      );

      return;
    }

    report(ScenarioStatus.Running);
    const seed = Number(harnessParam(HarnessParam.Seed) ?? DEFAULT_SEED);
    runScenario(requested, Number.isFinite(seed) ? seed : DEFAULT_SEED).then(
      () => report(ScenarioStatus.Ready),
      (error: unknown) => report(ScenarioStatus.Failed, String(error)),
    );
  }, [hydrated, routerReady]);

  return null;
}
