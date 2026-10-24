# Product

<!-- impeccable:product-schema 1 -->

This is the place to start if you want to understand Nearby Dice: what we are building, what we have
already decided and which questions are still waiting for an answer. The other documents each
explain one part of the product in depth; this one gives the overview and points you to them.

**Where we are:** every screen, rule and session flow of the React Native app is built and covered
by tests (see the [README](README.md) and the
[technical design](docs/technical-design.md)). What is still missing is proof on real hardware: the
Nearby connection has not yet been verified on phones
([#25](https://github.com/lukasjakobi/nearby-dice/issues/25)).

**How to read the labels:** each decision carries a status.

- **Confirmed** means we agree on the direction. It does not necessarily mean the feature is built.
- **Proposed** means a suggestion is on the table, waiting for agreement.
- **Open** means we don't have an answer yet.
- **Verified** is reserved for technical claims backed by evidence, such as official documentation
  or a recorded test on real devices.

## Product Purpose

A group of friends should be able to start a dice game together in seconds: one person hosts, the
others join, everyone agrees on how to play, and every phone follows the same turns and scores.

## Users

Friends who are sitting together in the same place, each with their own phone. A group can mix
Android phones and iPhones.

## Platform

**Confirmed:** Android and iOS, including groups that use both. The interface adapts to whatever
screen space a phone offers.

## Stack

**Confirmed direction:** React Native for the app itself, and Google Nearby Connections to let
phones talk to each other directly.

## Operating Context

Every player uses their own phone. The host creates the round, decides who may join and chooses the
game mode. Ideally, players see the rules before they mark themselves as ready, but the app has no
ready-up step yet (**Open**, see [Open Decisions](#open-decisions)). During the game, all phones must
agree on whose turn it is and which scores have been entered.

Permissions, waiting, interruptions and recovery are part of the experience, not edge cases, so
each of them needs clearly defined behaviour. The
[technical design](docs/technical-design.md) describes what the app does today; how it should handle
interruptions is still open.

## Capabilities and Constraints

**Confirmed scope:**

- Hosting and joining rounds with nearby phones.
- **Training:** a single-player mode on one phone, with its own best score that stays separate from
  the multiplayer statistics.
- **Saved games:** the last 10 finished multiplayer games, including every player's full sheet, can
  be reopened from the home screen.
- Classic turn-based play in predefined game modes (presets), without individual rule settings.
- Turns and scores shared across every phone in the round.
- Home, lobby, game, results and settings screens, including their waiting, error and recovery
  states.
- A modern, uncluttered interface in light and dark themes.

The automated tests simulate whole sessions over an in-memory network. They show that the game logic
behaves correctly, but real phone-to-phone communication still has to be verified on devices.

## Brand Commitments

**Confirmed:** the app's text is German and English: it follows the device language, or the one
chosen in Settings, and other device languages get English. It comes in light and dark themes, and it should look
modern and clean. The app draws its own working logo (`src/ui/logoMark.ts`, which also generates the
app icons), but a full visual identity hasn't been established yet.

## Evidence on Hand

Our references are this document, the documents listed below, and the code with its tests. No test
on real devices has been recorded yet, and mixed Android and iOS rounds in particular still need one.

## Product Principles

- Hosting and joining a round should be easy to understand at a glance.
- Players should see the host's chosen rules before they get ready to play.
- Game results and connection status must be the same on every phone.
- Whenever a permission is needed, a connection drops or the game is waiting, the app explains what
  is happening and what the player can do about it.

## Documentation Map

Start here, then follow the table to the document that answers your question.

| File                                                 | Read it when you want to know…                        | What belongs there                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PRODUCT.md` — this file                             | What are we building, for whom, and what is decided?  | Purpose, scope, principles, major open decisions, and this reading map.                                                                                                                                                                                                                       |
| [README.md](README.md)                               | What is the app, and how do I get, play, or build it? | Features, download, how to play, permissions, build setup and scripts, and troubleshooting.                                                                                                                                                                                                   |
| [docs/technical-design.md](docs/technical-design.md) | How do the phones make the agreed behavior work?      | Main application parts, where game information lives, how changes travel between phones, host authority, Nearby integration, permissions, platform differences, and recovery. Explain technical terms and record the reason and any device-test results alongside the relevant design choice. |
| [CONTRIBUTING.md](CONTRIBUTING.md)                   | How do I contribute a change?                         | Project structure, conventions, testing, dependency updates, releases, the definition of done, and branch, commit, and pull request style.                                                                                                                                                    |
| [SECURITY.md](SECURITY.md)                           | How do I report a vulnerability?                      | Private reporting, scope, and supported versions.                                                                                                                                                                                                                                             |

**Proposed:** two more documents, to be written once there is real content to review rather than
empty outlines:

| File                        | Read it when you want to know…                         | What belongs there                                                                                                                                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/game-rules.md`        | How does a game work from joining to the final result? | Players and host responsibilities; admission and readiness; starting a game; turn order; dice and scoring rules; presets; ending a game; leaving, disconnection, and rejoining rules. Include worked examples.                                                                     |
| `docs/screens-and-flows.md` | What does each player see and do?                      | Routes through home, hosting, joining, lobby, play, results, and settings. For each screen: purpose, visible information, actions, text, and loading, empty, error, permission, and recovery states. Include light/dark references and annotated mockups as they become available. |

Until those exist, the rules live in `src/domain/` and its tests, and the screens in `src/features/`.
Open work is tracked in GitHub issues rather than in a separate plan.

### Reading Order

For the full picture, read **Product → README → Technical design**. If you have a specific question,
use the tables above to jump straight to the right document.

### Keeping the Documentation Understandable

- Give every document a plain-language title, a short note on its purpose and a link back to this
  overview.
- Name files in `docs/` in lowercase with hyphens, and keep the names stable as the content grows.
- Explain each term the first time it appears. Illustrate rules with concrete examples, and use
  diagrams for interactions that are hard to describe in words.
- Keep each rule or decision in one place. Other documents link to its heading instead of repeating
  it; screen descriptions, for example, link to the scoring rules rather than restating them.
- Mark statements as **Confirmed**, **Proposed**, **Open** or **Verified**. Keep unanswered questions
  next to the subject they concern, and briefly explain the reasoning behind significant decisions.
- Make clear whether a description refers to intended behaviour, a simulation or working
  functionality, and record verification evidence with its date and conditions.

A decision's reasoning belongs right beside it, in a sentence or two. Separate research notes,
plans, decision logs and status files would only add more places to search.

Add a new document only when it answers a distinct question that the existing ones can no longer
cover clearly.

## Open Decisions

These questions affect the product as a whole. More detailed questions live in the relevant document
or GitHub issue.

| Topic                | Current position                                                                                                                                                                                             | What still needs agreement or evidence                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Group size           | **Confirmed:** 2–6 players. Every round admits up to 6; there is no setting. The limits live in `src/domain/rules.ts`.                                                                                       | A six-player scoreboard that fits a phone screen ([#19](https://github.com/lukasjakobi/nearby-dice/issues/19)) and a test with six phones.               |
| Rule presets         | **Confirmed:** predefined presets only, with no custom rules. The app ships eight presets, defined in `src/domain/rules.ts`; the host picks one and can switch it in the lobby and on the results screen.    | A written description of each preset in `docs/game-rules.md`.                                                                                            |
| Scoring              | Every mode awards 50 points for every further Yatzy under one joker rule ([Further Yatzys](docs/technical-design.md#further-yatzys)). The presets in `src/domain/rules.ts` decide the other scoring options. | Complete written scoring rules with edge cases and examples; today they exist only in the code and its tests.                                            |
| Ready-up             | **Open:** players should mark themselves as ready after seeing the rules, but the lobby has no ready state yet. The host can start as soon as two players are connected.                                     | Add a ready-up step, or agree that seeing the rules in the lobby is enough ([#29](https://github.com/lukasjakobi/nearby-dice/issues/29)).                |
| Interruptions        | **Proposed:** focus on recovery while the app is open. Guest reconnects and resuming after an app restart already work ([README](README.md#-how-it-works)).                                                  | What happens when a player leaves, loses the connection or puts the app in the background, including when that player is the host.                       |
| Nearby communication | **Confirmed direction:** Google Nearby Connections.                                                                                                                                                          | Evidence that the Android and iOS combinations we need, and recovery, work on real phones ([#25](https://github.com/lukasjakobi/nearby-dice/issues/25)). |
| Peer verification    | **Open:** the app does not check that a connection really leads to the intended phone.                                                                                                                       | Let players compare matching connection digits when joining, or document the limitation ([#28](https://github.com/lukasjakobi/nearby-dice/issues/28)).   |
| Settings             | Game rules come only from presets. The settings screen covers the profile, appearance, sound, music, vibration, keeping the screen on, the Nearby permission and resetting statistics.                       | Which further settings would be worth adding.                                                                                                            |
| Product name         | **Confirmed:** Nearby Dice.                                                                                                                                                                                  | A visual identity before the first store release ([#26](https://github.com/lukasjakobi/nearby-dice/issues/26)).                                          |
| Documentation        | **Proposed:** the two further documents in the [Documentation Map](#documentation-map).                                                                                                                      | Refine the structure as real content is written and gaps appear.                                                                                         |
