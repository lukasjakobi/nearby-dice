---
name: full-app-check
description: Run a full Nearby Dice application audit across all routes, scenarios, component stories and automated checks, with independent screenshot scores, an interactive findings summary and resumable coverage tracking.
---

# Full application check

**Confirmed workflow:** audit the whole repository's supported automated and visual surfaces.
Invoke with `$full-app-check` or "run a full application check". Default to **review only**: capture,
test and report; implement fixes only when the user asks. A request to install this skill does not
itself ask to run the audit. Follow `AGENTS.md`, `PRODUCT.md`, `CONTRIBUTING.md`,
`.claude/skills/browser-testing/SKILL.md` and
[ui-improvement](../ui-improvement/SKILL.md). Reuse its judge rubric, evidence format, conversation
controls and checkpoints rather than inventing a second scoring system.

## 1. Inventory the current application

Create a unique parent run under `.screenshots/ui-review/<run-id>/` in an isolated worktree. Use
[the coverage template](coverage-template.md) for `coverage.md`. Inventory actual source files,
not just the examples below:

- Every route in `src/app/`, mapping route groups/layouts to the visible screens and shared shell.
- Every scenario returned by `npm run web:shot -- --list`.
- Every story entry from the current Storybook `index.json`, including `ui`, `shared` and feature
  stories. Build Storybook first; verify the index matches current `*.stories.tsx` files. A successful
  build alone is not evidence that every story renders.
- Application layers and their checks: domain/scoring, session/protocol, transport, persistence,
  localisation, shell/navigation, features and the native bridge. Use the technical design's layer
  and testing tables to assign evidence and explicitly unverified checks.

Assign every route, scenario, story entry and layer a stable coverage ID and owning area. Route
layouts may map to existing screenshots rather than need duplicate captures. Reuse a capture for
multiple coverage rows only when it actually proves each row. New features discovered in source
must be added even when this document does not name them.

## 2. Execute automated checks once

Run each of the following from this worktree and save command, revision, exit status and log path
in `checks.md`. These run once for the parent audit, not once per reviewer:

```sh
npm run check
npm run e2e
npm run storybook:build
npm run check:release-bundle
```

Use a verified worktree-owned browser server and set `WEB_URL` for smoke flows and captures per
the browser-testing skill. Inspect `playwright.config.ts`: its server startup command uses its own
default port, so a custom `WEB_URL` requires a prestarted matching server and reuse enabled. Check
the current configuration rather than accidentally exercising another checkout. Record setup or
dependency failures as **blocked**, test failures as **failed**, and continue independent checks.
Save failing screenshots/traces and warnings; zero exit status with a warning is a pass with a warning.

## 3. Capture and judge every UI area

Partition the inventory into player tasks, such as onboarding/profile, home/history/resume,
hosting/preset setup, joining/permissions, host/guest lobby, active/waiting/six-player game,
training/setup/results, multiplayer results/rematch, saved games, and settings/updates. Include
the shell, shared sheets, dialogs, transient feedback, interruptions and recovery. Derive actual
states from the implementation, available stories and harness options.

For each area, follow `ui-improvement` to create a brief and capture manifest. Cover **every listed
scenario** and **every routed screen**, including screens reached by navigation/taps rather than a
named scenario (for example host setup, profile and training setup). Use its eight-combination
primary-state matrix. Cover relevant waiting, empty, failure, recovery and selected states; inspect
permissions/radio and each supported simulated update status from the current source. Exercise all
current rule presets where they alter the scorecard or controls. Keep taps, presets, scrolling and
seeds reproducible. Unreachable states need a story or an explicit coverage gap.

Render and inspect **every story entry** at least at German/light/390×844, logging page and console
errors. Add dark/English/small-phone captures for dense, interactive or stateful stories, and all
variants requested by the user. List the tested combinations explicitly: story presence or a build
does not imply all variants were inspected. Use the current Storybook iframe IDs and globals from
`.storybook/preview.tsx`; confirm the intended state and fonts have loaded before shooting. Capture
scroll positions for content below the fold. A hidden or empty story is not a successful render.
Include story-only states in their owning area's judge package; shared primitives can have their
own package. Record interaction behaviour separately from still images.

Dispatch fresh image-capable, read-only judge subagents per area using the `ui-improvement`
dispatch contract. Limit concurrency to the available runtime slots and keep capture channels
isolated. Each judge must explicitly inspect every assigned image and return the fixed scorecard.
Split large packages into bounded batches while retaining IDs, coverage and the same rubric; do
not replace unseen screenshots with descriptions to fit context. Save each report. Show compact
progress by area (reviewed/total, failed/blocked, lowest score); use screenshot review cards at
useful milestones rather than asking the user about every component.

If a runtime/time budget prevents finishing, save the next coverage ID in the checkpoint and
report **partial**, with reviewed/total counts. Resume the remaining inventory later; never label
a sample or a skipped state a full check. If image-capable independent agents are unavailable,
retain captures and mark judging blocked or explicitly label a self-review.

## 4. Aggregate and offer the next batch

Create `report.md` with:

- Automated checks: passed, failed or blocked, with warnings and log links.
- Coverage counts by routes, scenarios, story entries, state/variant combinations and layers;
  enumerate every gap. Separate visual inspection, interaction checks, simulation and device evidence.
- Per-area score `/10`, lowest state, confidence, report link and open P1/P2/P3 counts. Use namespaced
  finding IDs (e.g. `join/UX-001`) to avoid collisions between judges.
- An equally weighted mean of complete area scores, shown alongside the worst area/state. Describe
  it as a **reviewed-area average**; if any area lacks a complete score, mark the application total
  incomplete rather than silently excluding that area. List coverage limits next to any average.
- Cross-area findings deduplicated by cause with all affected evidence IDs, and at most three
  recommended fixes ordered by user impact. Link recurring issues back to the shared component.
- A separate real-device checklist for Android/iOS and mixed Nearby connections, permissions,
  backgrounding/recovery, native rendering, haptics/audio and accessibility. Mark untested items
  **unverified**; browser or unit tests cannot establish them.

The full automated/visual audit is complete only when every planned row has inspected evidence
or an explicit failed/blocked status; **passed** additionally requires all required automated
checks to pass, all planned captures to render and be judged, and no open P1. Any blocked or missing
coverage makes the outcome partial/blocked. Keep device readiness separate even when the audit passes.
Present a concise interactive summary with the weakest area screenshot and offer to inspect a
finding or start the recommended improvement batch. An audit alone authorizes no fixes or PR.
An explicit improvement request uses `ui-improvement` with a separate bounded budget; retain this
audit as the baseline and recheck all affected areas, including shared-component consumers.
