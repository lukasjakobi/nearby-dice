---
name: browser-testing
description: See and test Nearby Dice in a browser. Use to screenshot a screen or game state, check a UI change, play several phones as tabs, or run or write the Playwright smoke flows.
---

# Browser testing

The web build is a test harness, not a product: browser tabs play the phones, and a
BroadcastChannel stands in for Nearby. What it is and why lives in `docs/technical-design.md`,
Browser harness; this file is how to drive it.

## Look at a screen

1. List the scenarios: `npm run web:shot -- --list`. Each opens one screen in one state (lobby,
   my turn, waiting, six players, results, …) with bots playing the other phones in the same page.
2. Shoot: `npm run web:shot -- <scenario>`. It reuses the dev server on `WEB_URL` (default
   `http://localhost:8081`) or starts one, waits for the scenario, writes `.screenshots/<name>.png`
   and prints its path, then any page or console errors.
3. Read the PNG. Done when every screen your change touches is shot in light and `--dark`, and no
   run printed an error.

Options:

- `--tap <name>` taps a button by its exact German accessible name; repeat it to go further, e.g.
  `game-six-players --tap Verlauf` opens the score history.
- `--type <text>` types into the first visible text field after the taps (or into whatever has
  focus, like the join code): `onboarding --tap Weiter --tap Weiter --type Mira`.
- `--show <text>` scrolls the element with that exact text into view before the shot, for parts
  below the fold: `settings --param update=available --show "Nach Updates suchen"`.
- `--dark`, `--en`, `--size 390x844`, `--seed 7` (other dice; the default seed repeats exactly).
- `--param key=value` adds a URL option to the scenario: `update=available` (or `checking`,
  `upToDate`, `downloading`, `checkFailed` …) shows the settings' update card, which the web build
  otherwise lacks. For the permission and radio sheets:
  `permission=denied|blocked|unavailable` or `radio=bluetooth-off|location-off`. For example,
  `home --param permission=blocked --tap Hosten --tap "Lobby öffnen"`.

## Scenario coverage

`--list` is the full catalog. Beyond the populated screens, these modes cover distinct states
without extra taps:

| Area                | Modes                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Setup and discovery | `profile`, `host-setup`, `training-setup`, `join-empty`, `join-nearby`                                                    |
| Turn controls       | `game-before-roll`, `game-my-turn`, `game-held-dice`, `game-last-roll`                                                    |
| Other players       | `game-waiting`, `game-six-players`, `game-player-lost`                                                                    |
| Preset scorecards   | `game-top-to-bottom`, `game-blitz`, `game-same-dice`, `game-triple`, `game-yatzy`, `game-classic-xl`, `game-lucky-number` |
| Results variants    | `results`, `results-four-players`, `results-guest`, `results-rematch`, `results-training`                                 |

`game-player-lost` disconnects a real bot on its turn, leaving the host's recovery actions
available. `results-rematch` leaves guest votes pending after the host votes yes. Timed presets
keep their real countdowns running; capture them promptly. Sheets and dialogs remain reachable
with `--tap`; permission, radio and update variants use `--param` as described above.

## Several phones by hand

For exploring rather than shooting, start `npm run web` and open one tab per phone at
`http://localhost:8081/?as=<name>` in the browser pane. Each name keeps its own profile and saved
data, through navigation and reloads; the tabs find and join each other like phones in one room.

## Smoke flows

`npm run e2e` runs `e2e/*.spec.ts` against the dev server (Playwright starts one if needed). Run it
when a change touches screens, `session` or `net`; CI runs it on every pull request. Write flows
with `Phone` from `e2e/Phone.ts`: `Phone.open(context, name)` onboards a tab, `startGame` hosts and
joins, `nextUp` finds whose turn it is, `playTurn` rolls and enters a field. Name buttons by their
full German accessible name; a failure's `error-context.md` in `test-results/` lists every button
on screen, and `npx playwright show-trace` replays it.

## Add a scenario

Add a value to `Scenario` (`src/dev/scenario.ts`) and its setup in `src/dev/scenarios.ts`: open
sessions on the `Table`, let bots `play`, `stopWhen` the host reaches the state, and return the
route with `show(session, Route.X)`. Bot guests think for 120 ms so they stay under the host's
message cap; bots on the host can use `thinkMs: 0`.

## What the browser shows differently

- Fonts, shadows, SVG and safe areas come from react-native-web and can differ slightly from a
  phone; judge spacing on a device before a release.
- No radio, no haptics, and no `Platform.OS === 'android'` branches (the Location hint in the
  permission sheet, for one).
- Scenarios exist only in dev builds; `npm run check:release-bundle` proves they stay out of
  releases.

## Gotchas

- `web:shot` and `e2e` use whichever server answers on the port, possibly another checkout's. In a
  worktree, run `npx expo start --web --port 8082` there and set `WEB_URL=http://localhost:8082`.
- `CI=1 expo start` serves without watching files: edits only show after a restart.
- Both scripts launch full Chromium (`channel: 'chromium'`); the headless shell crashes on this app.
  Install it with `npx playwright install chromium`. A sandboxed shell can stop Chromium from
  starting; run the command outside the sandbox.
