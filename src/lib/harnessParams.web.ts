import { HarnessParam } from './harness';

const TAB_KEY = 'nearbydice.harness';
/**
 * Kept in sessionStorage for the tab's lifetime: navigation drops the query and a reload must
 * stay the same player. A scenario and its seed apply to the first load only.
 */
const TAB_PARAMS: HarnessParam[] = [HarnessParam.As, HarnessParam.Permission, HarnessParam.Radio];

type Params = Partial<Record<HarnessParam, string>>;

let params: Params | null = null;

function readTab(): Params {
  try {
    return JSON.parse(sessionStorage.getItem(TAB_KEY) ?? '{}') as Params;
  } catch {
    return {};
  }
}

function read(): Params {
  const query = new URLSearchParams(globalThis.location?.search ?? '');
  const tab = readTab();
  const found: Params = {};
  for (const name of Object.values(HarnessParam)) {
    const value = query.get(name) ?? (TAB_PARAMS.includes(name) ? tab[name] : undefined);
    if (value) found[name] = value;
  }

  try {
    const kept = TAB_PARAMS.filter((name) => found[name]).map((name) => [name, found[name]]);
    sessionStorage.setItem(TAB_KEY, JSON.stringify(Object.fromEntries(kept)));
  } catch {
    // Without sessionStorage a reload forgets the options; the first load still has them.
  }

  return found;
}

/** The option from the URL, or from an earlier load of this tab. */
export function harnessParam(name: HarnessParam): string | null {
  params ??= read();

  return params[name] ?? null;
}
