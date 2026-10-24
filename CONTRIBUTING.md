# Contributing

Thanks for helping with Nearby Dice! This guide explains how the project is organised, what a
finished change looks like and how to send it. To learn what we are building and why, start with
[PRODUCT.md](PRODUCT.md).

## The best way to help: test on real phones

The Nearby connection has not been verified on real devices yet: every automated test runs over an
in-memory network. If you have two or more Android or iOS phones, working through the test plan in
[#25](https://github.com/lukasjakobi/nearby-dice/issues/25) and sharing your results there helps
more than anything else.

## Setup

Follow [Build it yourself](README.md#-build-it-yourself) in the README. Because Expo Go cannot load
the native Nearby module, the app runs as a development build on real phones.

## Before you start

- Read up on the part you want to change: [PRODUCT.md](PRODUCT.md) covers scope and open decisions,
  [docs/technical-design.md](docs/technical-design.md) covers layers, protocol, host authority and
  permissions, and this guide covers structure and conventions.
- For larger changes, or anything marked **Open** in PRODUCT.md, please open an issue first so we can
  agree on the direction.

## Project structure

```text
src/
  app/        Routes only (Expo Router). Each file re-exports one screen from a feature barrel.
  features/   One folder per screen or layout (see "Feature folders" below).
  shared/     Cross-feature building blocks: lobby rows, preset grid, rules sheet, navigation,
              permission gate, feedback/time hooks, small view-model helpers.
  session/    Host and guest sessions: admission, game flow, reconnects, the message protocol.
  net/        Transport over Nearby Connections (plus an in-memory fake for tests). Moves strings only.
  domain/     Pure game rules: scoring, engine, presets, option values. No React, no I/O.
  store/      Data kept on the phone: profile, statistics, last 10 games, settings, interrupted session.
  i18n/       i18next setup and all app text in locales/de.json and locales/en.json.
  ui/         Design system: theme tokens, Text, Button, Footer, Dialog, Sheet, DieFace, icons …
  lib/        Tiny generic helpers (typed emitter, timers, ids).
  test/       Fixtures, render helpers and a bot player for tests.
modules/
  nearby-connections/   Local Expo native module: Kotlin + Swift bridge to Nearby Connections.
```

Dependencies only point downwards; which module may import which is the
[layer table](docs/technical-design.md#layers). `domain` imports nothing.

Every module has an `index.ts` barrel, and other modules import **only** from it (`@/domain`,
`@/shared`, `@/features/game` …). Inside a module, imports are relative and never climb out of it,
so a file at a module's root (or a feature's) has no `../`. ESLint (`no-restricted-imports` in
`eslint.config.js`) enforces these rules; tests may reach into internals.

### Feature folders

Every feature has the same shape, so you know where to look before opening a file:

```text
features/<name>/
  index.ts            barrel: only the screens (or layouts) the app routes to
  <Name>Screen.tsx    composition only (`SessionLayout`, `AppShell` for the two layout features)
  hooks/              state, effects and actions; the screen's main hook is its view model
  view/               pure builders (snapshot → display-ready props), unit-tested; only where needed
  components/         one component per file
  __tests__/          Jest only runs tests in here
```

| Looking for …                                          | Look in                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------ |
| What a screen shows and when (labels, states, enabled) | `view/`, e.g. `game/view/controlView.ts` (dice, roll button) |
| What a tap does, timers, toasts and haptics            | `hooks/`, e.g. `game/hooks/usePendingScore.ts`               |
| Layout and styling                                     | `components/`                                                |

- Each subfolder has an `index.ts`. Files outside it import the barrel (`../view`, `../hooks`);
  files inside import their siblings directly.
- Types live next to the code that produces them; there are no `types/` or `utils/` folders. A
  helper several features need goes to `shared/`, game maths to `domain/`.
- Folders stay one level deep (ESLint forbids `../../`). When a builder or hook grows too large,
  split it by part of the screen, as in `game/view/` (`sheetView`, `controlView`, `statusView`).

## Conventions

- **The host is authoritative.** It validates every move and broadcasts the full session state;
  guests only send intents (`Roll`, `Hold`, `Score`, `Vote`).
- **English, typed state.** Every state value is a string `enum` (`Joker.Official`, `SessionPhase.Lobby`,
  `CellState.Preview`). Compare against enum members, never against strings.
- **One component per file.** Helper components get their own file in the feature's `components/`.
- **Game options have one source of truth.** The allowed values (`ROLLS_PER_TURN`, `SECONDS_PER_TURN`,
  `YATZY_BONUSES`, `SHEET_COUNTS`) live in `domain/rules.ts`; the setup screen, message validation and
  labels derive from them.
- **Screens = view model + components.** For example, `useGameScreen` / `buildGameView` turn the session
  snapshot into display-ready props (`CellView`, `ControlView` …). Components only render props and call
  callbacks. Visual variants are enum-keyed maps (`Record<CellState, CellLook>`), not `if` chains.
- **Navigation** goes through `navigate.push(Route.X)` / `navigate.replace(Route.X)` from `@/shared`.
  The session phase decides the screen (`features/session/routing.ts`).
- **Styling**: the theme palette via `useTheme()`, static styles in `StyleSheet.create`.
  Never hard-code colours, except the dice and player colours in `ui/theme/tokens.ts`.
- **Accessibility**: touch targets ≥ 44 pt, roles (`radio`, `switch`, `alert` …), labels on icon
  buttons, Dynamic Type up to 130 %, and reduced motion respected.

## App text

The app speaks German and English. All of its text lives in `src/i18n/locales/de.json` and
`en.json`, read through i18next: components call `t('home.greeting', { name })` from
`useTranslation()`, and pure builders (`build…View`) take `t` as their first parameter. Keys are typed
from `de.json`. Labels for enums and option values are keyed by the enum value
(``t(`labels.category.${category}`)``), and `src/i18n/__tests__/i18n.test.ts` checks that both files
have the same keys and that every enum value has a label. Plurals use `_one`/`_other` keys with
`count`; `{{name, possessive}}` and `{{names, names}}` format names per language.

The German wording is final and uses "du", sentence case and „ “ quotes. The English copy uses
sentence case, British spelling and “ ” quotes. Reuse existing strings where you can. If your change
needs new wording, ask in the issue or pull request before you write it, add it to both files, and
list the new strings in the pull request. Code, comments and docs are in English.

## Testing

Tests live in `__tests__/` folders as `*.test.ts(x)`; Jest skips test files anywhere else. Session
behaviour is tested with real host and guest sessions over an in-memory network with fake timers.
Reuse the fixtures, render helpers and bot player in `src/test/`. What each layer covers is listed
under [technical design → Testing](docs/technical-design.md#testing).

## Native and radio changes

Changes to `modules/nearby-connections/`, `src/net/nearby/`, permissions or native config cannot be
proven by the test suite. Report them as **untested** unless you verified them on real phones; if you
did, name the devices, OS versions and what you tried. `android/` and `ios/` are generated by
`expo prebuild`; change native config in `app.json` or `plugins/*.js` instead.

## Updating dependencies

- Dependabot groups Expo SDK packages into one pull request of patch updates. Before merging it, run
  `npx expo install --check`, and `npx expo install --fix` if it reports mismatches. Upgrade the SDK
  itself with `npx expo install expo@latest`, then `npx expo install --fix`.
- Keep `@eslint/compat` around the Expo ESLint config until its plugins support ESLint 10, and keep
  `eslint-import-resolver-typescript` as a direct dependency.
- `npm run typecheck` uses TypeScript 7 through the `@typescript/native` alias; `typescript` stays on
  version 6 for tools that need its compiler API. Keep both when updating TypeScript.

## Releases

[`check.yml`](.github/workflows/check.yml) runs `npm run check` on every pull request and every push
to `main`. [`build.yml`](.github/workflows/build.yml) builds a signed Android release APK:

- **Release:** push a tag (`git tag v1.0.0 && git push origin v1.0.0`); the APK is attached to a
  GitHub release of that name. Only the maintainer can push `v*` tags, and once pushed they can't be
  moved or deleted, so tag the right commit on `main`.
- **Test build:** Actions → Build → Run workflow (tag left empty); the APK is a downloadable workflow
  artifact.

The tag sets the app version: [`app.config.js`](app.config.js) reads it from `NEARBY_DICE_VERSION`
and derives the Android `versionCode` from it (1.2.3 becomes 10203), so tags must be
`vMAJOR.MINOR.PATCH` with minor and patch below 100. Builds without a tag use the `package.json`
version. Don't put a version in `app.json`.

Release builds require a production keystore and never fall back to the debug key
(`plugins/withReleaseSigning.js`). For a local release, set `NEARBY_DICE_RELEASE_STORE_FILE` (an
absolute keystore path), `NEARBY_DICE_RELEASE_STORE_PASSWORD`, `NEARBY_DICE_RELEASE_KEY_ALIAS` and
`NEARBY_DICE_RELEASE_KEY_PASSWORD`. CI reads the same values from repository secrets, with the
keystore itself base64-encoded in `NEARBY_DICE_RELEASE_KEYSTORE_BASE64`.

Keep keystores and credentials outside the repository; none are included in this project. Every
release must be signed with the same keystore, or installed apps cannot update.

## Done means

`npm run check` passes: typecheck, lint, format check and tests. CI runs the same checks. When a
change alters documented behaviour, update the document that owns it (see
[Keeping the Documentation Understandable](PRODUCT.md#keeping-the-documentation-understandable)).

## Branches, commits and pull requests

- Branch from `main` with a short descriptive name, for example `fix/kick-frees-seat`.
- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`,
  `refactor:`, `test:`, `ci:`, `chore:`.
- Pull request titles follow the same prefix and are all lowercase except brand names, for example
  `fix: free the seat when the host kicks a player` or `docs: explain iOS Local Network prompts`.
- Fill in the pull request template: what and why, the issue it closes, how you tested, device
  verification status and any new strings.
- `main` only changes through pull requests. Before merging, the `check` job must pass on a branch
  that is up to date with `main` ("Update branch" brings it up to date), every review thread must be
  resolved, and the maintainer must approve. Pull requests are squash-merged, so the title becomes
  the commit message; the branch is deleted afterwards.

## Code of conduct

Everyone taking part follows the [code of conduct](CODE_OF_CONDUCT.md).

## Security

Please don't report vulnerabilities in public issues; [SECURITY.md](SECURITY.md) explains how to
report them privately.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
