---
name: ui-improvement
description: Review a specific Nearby Dice UI area with an independent screenshot judge scoring 0–10, or run bounded implementation and reassessment cycles to improve it over time.
---

# Screenshot review and improvement

**Confirmed workflow:** use this skill to review or improve one named screen, component or flow.
Product intent remains in `PRODUCT.md`; implementation rules and completion checks remain in
`AGENTS.md` and `CONTRIBUTING.md`. The judge's rubric lives only in
`.claude/agents/ui-ux-judge.md`.

## 1. Bound the run

Read those documents and `.claude/skills/browser-testing/SKILL.md`. Resolve the target and player
task from the request. Ask for the target only when it cannot be inferred. Default to **review only**
for a rating/review request; an improvement request authorizes implementation within that scope.
Default improvement budget: **two implementation rounds**, target **8.0/10**, no unresolved P1s,
and no state or dimension regression from the baseline. User-specified limits override defaults.
The target is a stopping threshold, not a reason to inflate a score.

Use an isolated worktree per `AGENTS.md` for edits. Record the branch, commit, dirty state and a
unique run ID. Keep evidence under `.screenshots/ui-review/<run-id>/` in that worktree; these local
artifacts are ignored, so report their absolute path at handoff. Preserve earlier runs to compare
progress; never describe local artifacts as committed or available on another machine.

Create `brief.md` using [the run template](run-template.md). Name the target, primary player task,
mode, constraints, round limit, threshold and evidence matrix before scoring. This is the stable
contract for the run, not permission to broaden the product.

## 2. Capture comparable evidence

List real scenarios with `npm run web:shot -- --list`; choose the smallest set covering the target.
Use the browser-testing skill for commands, server isolation and error handling. For a component,
use its actual Storybook story per `docs/technical-design.md`, Storybook; include at least one
in-context screen when judging its place in a task.

Default matrix: the primary state in light/dark, German/English, at **390×844** and **320×568**.
Include at least one relevant alternate state (waiting, empty, error, selected, disabled or recovery)
where the application supports it. For a multi-step flow capture each step and record a separate
interaction smoke check. Mark unsupported or unavailable cases as coverage gaps rather than inventing
scenarios. Expand the matrix only for a concrete risk or a user request; keep it unchanged on reassessment.

Give each case a stable ID and its own output directory: the screenshot filename does **not** include
viewport size, so different sizes otherwise overwrite each other. For example, from the worktree:

```sh
WEB_URL=http://localhost:8082 npm run web:shot -- game-my-turn --seed 7 --size 390x844 --out .screenshots/ui-review/<run-id>/baseline/turn-de-light-390
WEB_URL=http://localhost:8082 npm run web:shot -- game-my-turn --seed 7 --size 320x568 --dark --en --out .screenshots/ui-review/<run-id>/baseline/turn-en-dark-320
```

These commands illustrate two cases, not the full matrix. Record each exact command, image path,
scenario/story, seed, viewport, locale, theme, scroll/taps, revision, capture time and console/page
errors in `manifest.md`. Verify that the server belongs to this worktree and serves the current
revision, restarting a non-watching server after edits. Inspect the images and logs; recapture
tool failures before dispatch. An application error is a finding, not a reason to omit a case.

## 3. Dispatch an independent judge

Spawn a **fresh, read-only subagent** with the complete contents of
`.claude/agents/ui-ux-judge.md`, the brief, manifest and absolute image paths/attachments. Explicitly
give it image-reading capability; in Claude Code the named agent is `ui-ux-judge`. Use minimal
context where supported so it does not inherit implementation plans, desired praise or previous
scores. Give it repository context for product constraints. Require confirmation that every image
was opened. If the runtime cannot supply image-capable subagents, report the limitation and provide
the ready-to-use judge brief; any parent review is labelled **self-review**, never independent.

Save its report verbatim as `baseline/review.md` (or `round-<n>/review.md`). A review-only request
ends here with the score, top findings, coverage limits and evidence path. Missing evidence or
an incomplete score triggers evidence repair, not implementation based on a guessed score.
If the baseline already satisfies the stopping threshold, complete the applicable verification
checks and record the result without making unnecessary edits.

## 4. Implement one small batch

For an improvement request, select up to three actionable findings: P1 before P2 before P3. Record
their IDs, expected user benefit and acceptance checks in `changes.md`. Make only changes needed
for this batch, following repository structure and design-system conventions. Ask for required
wording/product decisions while progressing independent changes; do not turn hypotheses into new
features. Keep the judge read-only and independent of the implementation.

Run the completion checks required by `AGENTS.md` for the actual changes, including screen smoke
flows, screenshots and component stories where applicable. Save outcomes and distinguish web
simulation from real-device verification. A higher design score never overrides failing checks.

## 5. Reassess and stop

Recapture **the entire same matrix** into `round-<n>/`, with the same seed, viewport, locale, theme,
steps and scroll positions. Give a fresh judge only the current evidence first. Once its score is
saved, supply the previous report to reconcile stable finding IDs and record resolved, remaining,
new and regressed issues in `comparison.md`, including per-state and per-dimension score deltas.
If cases or the rubric change, start a new baseline or compare only the common cases and label
the overall scores non-comparable. Keep the original baseline intact.

Stop when any of these applies:

- The threshold is met, all P1s are resolved, no state or dimension regressed, and required checks pass.
- The implementation round budget is exhausted, even if the target was missed.
- Comparable scope score fails to increase by at least 0.2 in a round; record diminishing returns.
- Progress depends on missing evidence, a user decision or unavailable device verification.

Investigate regressions against the visible evidence. Correct or revert only this run's responsible
changes, repeat required checks and recapture/review the resulting UI within the round budget.
If that cannot be done, report the regression as unresolved; do not silently keep a claimed win.
Preserve unrelated work and set edits aside with a WIP commit as required by `AGENTS.md`.

Update `history.md` in the run directory with one row per assessed revision: date, commit/dirty
state, matrix ID, scope/lowest scores, finding counts, report and check results. For future runs,
reuse the matrix and artifacts where available, but recapture the current code before claiming
progress. Export/copy the evidence directory when the user needs portable history.

End with the before/after score, important improvements, remaining findings, verification limits,
stop reason, branch and absolute evidence path. Keep the user-facing summary within the repository's
requested length. Commit instructions and code; leave generated screenshots and run reports local.
