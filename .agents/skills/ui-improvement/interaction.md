# Interactive review

This is the conversation layer for [the improvement workflow](SKILL.md). The orchestrator handles
questions and choices; the judge stays independent and read-only. Keep each chat response within
the repository's requested length; store detailed tables in the run artifacts.

## Show evidence at decision points

After baseline scoring, show a short review card containing:

- Target, score `/10`, lowest state, confidence and coverage gaps.
- One representative screenshot, plus the weakest state when different. Embed images using actual
  absolute paths; if previews are unsupported, link the files. Never invent paths or image content.
- Up to three finding IDs, priority, visible problem and recommended change with a user benefit.
- Recommended batch, remaining round budget, and the next available actions.

After each reassessment, show the same representative case before and after with explicit labels,
score delta and resolved/new/regressed IDs. Include the lowest state when it differs. Match viewport,
locale, theme and interaction state before calling images a comparison. If the images cannot be
matched, label them non-comparable and explain the missing capture. Link full reports for detail.

Use native multiple-choice controls when available, with a recommended option such as "Recommended
batch", followed by "Choose findings" and "Review only". Otherwise accept ordinary language. In
guided mode ask once for the batch selection and wait for it; that checkpoint exists because the
user chose guided interaction. A missing reply is never approval. In autonomous mode these actions
are steering options and do not interrupt work already authorised. Ask required wording or product
questions separately and continue independent work. Reuse known preferences instead of asking again.

## Understand steering

These are conversational intents, not terminal commands or newly installed app UI:

| User says                               | Orchestrator action                                                                                                                                         |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Focus on the scoreboard"               | Narrow the target. If the task or matrix changes, establish a new baseline before comparing scores.                                                         |
| "Show UX-002" / "Why does this matter?" | Open its screenshot, identify the location and explain observation → impact → acceptance check. Label any hypothesis.                                       |
| "Compare the dark version"              | Show matched captures from the current run and name the state ID and changes; capture missing evidence first.                                               |
| "Fix UX-001 and UX-003"                 | Implement only those findings and necessary dependencies, after checking scope and existing copy constraints.                                               |
| "Skip UX-002" / "Keep the colours"      | Record a deferred finding or design constraint, with the user's reason when given. Preserve unresolved findings and honest scores.                          |
| "What else could work?"                 | Offer up to two concrete approaches with benefits and tradeoffs; identify the recommended one. Mockups are labelled proposals and not scored as working UI. |
| "Continue automatically"                | Switch from guided to autonomous for the remaining agreed budget; record the change.                                                                        |
| "Let me choose each round"              | Switch to guided; finish any in-flight read-only capture, then wait before the next edit batch.                                                             |
| "Review only"                           | Stop implementing; finish safe evidence/report work. Preserve existing edits and report them.                                                               |
| "Pause" / "Stop"                        | Stop dispatching and editing; save a checkpoint, preserve work, and report completed work and any in-flight operation.                                      |
| "Resume the lobby review"               | Locate and validate the saved run using the rules below.                                                                                                    |

When feedback disputes a judgement, separate a factual correction from a preference. Ask the judge
to inspect the cited image and correct unsupported findings; preserve the original report and save
the correction separately. Preference alone does not change a score or erase an issue. A newly
approved product constraint belongs in the brief and, when appropriate, the owning product document.

## Resume without losing decisions

Save `checkpoint.md` after a report, user decision, completed batch or pause. It links to the brief,
manifest, latest report, history and comparison; identifies selected/deferred findings; records the
remaining budget and exact next step; and identifies any pending user decision.

On resume:

1. Locate the requested run in `.screenshots/ui-review/`. If several match, show their target,
   date and last score and ask which one; continue independent repository inspection meanwhile.
2. Verify the recorded worktree, branch, revision, matrix and artifacts exist. Compare tracked and
   untracked source changes as well as HEAD; commit equality alone does not prove evidence freshness.
   Use the saved diff/source fingerprint if available, otherwise treat dirty evidence as stale.
3. If evidence is missing or code changed, recapture current code and obtain a fresh judgement before
   presenting a current score. An old score stays labelled historical. Keep original evidence intact.
4. Restore the chosen mode, preferences, deferred findings and remaining budget. A resume does not
   reset the round allowance. A pending guided choice stays pending unless the new request resolves it.
5. Continue at the recorded next step. If the worktree was removed, use a new isolated worktree;
   explain lost local artifacts and rebuild evidence rather than pretending to restore them.

## Completion card

Show the original and final comparable scores, what visibly improved, outstanding findings,
verification limits and stop reason. Link the full evidence directory and state whether changes
are committed. Offer one relevant continuation (for example, inspect the weakest state); do not
start additional rounds or open a pull request unless authorised. Save the checkpoint as complete
or paused so a future run can distinguish finished work from an interrupted batch.
