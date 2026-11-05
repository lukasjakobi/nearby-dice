# UI review run

Copy this into a new run's `brief.md` and fill every field before dispatching the judge.

## Brief

- Run ID / date:
- Mode: review only / improve
- Interaction: guided / autonomous
- Scope (screen, component or flow):
- Primary player task / host or guest / game preset if relevant:
- Product constraints and relevant document sections:
- Worktree / branch / commit / dirty state:
- Implementation round limit / score threshold:
- Matrix ID:
- Required checks for this scope:
- Evidence directory (absolute):
- User constraints / preferences for this run:

## Matrix and manifest

Copy this table to `manifest.md`. One row per capture; use the same case IDs in every round.
Multiple scroll positions can belong to the same state ID.
Different viewport, locale or theme combinations have separate state IDs.

| Case ID | State ID | Scenario/story and steps | Size | Locale | Theme | Seed | Revision / dirty | Capture time | Exact command | Absolute image path | Console/page errors |
| ------- | -------- | ------------------------ | ---- | ------ | ----- | ---- | ---------------- | ------------ | ------------- | ------------------- | ------------------- |

- Coverage gaps and reasons:
- Interaction evidence (check, result, source):
- Device evidence (device/OS, check, date, result), or unverified:

## Judge dispatch

Load `.claude/agents/ui-ux-judge.md` as your role. Read the supplied brief and manifest and open
every attached image/path with your image-reading tool. Judge only the specified scope and task.
Return the role's complete report, using its fixed rubric. If images cannot be read, return the
blocked result without a score. Current evidence is supplied first; prior scores and change
descriptions will be supplied only after your independent score is recorded.

## History

Copy this table to `history.md`; link reports and comparisons relative to the run directory.

| Round / date | Commit / dirty | Matrix ID | Scope /10 | Lowest state /10 | Open P1 / P2 / P3 | Report / comparison | Required checks | Stop reason |
| ------------ | -------------- | --------- | --------- | ---------------- | ----------------- | ------------------- | --------------- | ----------- |

## Checkpoint

Copy this to `checkpoint.md` and update at each handoff. Fill unavailable values explicitly.

- Status: active / awaiting choice / paused / complete
- Run ID / updated time:
- Brief / manifest / latest report / history / comparison paths:
- Worktree / branch / HEAD / tracked and untracked source fingerprint:
- Evidence revision / freshness (current, stale, unknown):
- Mode / interaction style:
- Current round / implementation rounds remaining:
- Selected finding IDs / necessary dependencies:
- Deferred finding IDs / reasons (still counted as open):
- User preferences / decisions already resolved:
- Pending decision / exact question / why it is needed:
- In-flight operation / completed edits / check outcomes:
- Exact next step / stop reason:

### Decisions

| Time | User decision | Affected finding IDs | Constraint or scope change | Follow-up |
| ---- | ------------- | -------------------- | -------------------------- | --------- |
