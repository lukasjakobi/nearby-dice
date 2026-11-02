// Removes worktrees under .claude/worktrees/ whose work has landed: the checkout is clean and its
// HEAD is on origin/main or is the head of a merged (squashed) pull request. Their local branch
// goes too. `--dry-run` only lists what would be removed.
import { execFileSync, spawnSync } from 'node:child_process';
import { lstatSync, unlinkSync } from 'node:fs';
import { basename, dirname, join, sep } from 'node:path';

const dryRun = process.argv.includes('--dry-run');

const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

const root = dirname(git(['rev-parse', '--path-format=absolute', '--git-common-dir']));
const worktreesDir = join(root, '.claude', 'worktrees') + sep;
const current = git(['rev-parse', '--show-toplevel']);

git(['fetch', '--prune', '--quiet', 'origin'], root);
git(['worktree', 'prune'], root);

/** Squash merges leave no trace on main, so the PR's last head commit is what identifies them. */
const prList = ['pr', 'list', '--state', 'merged', '--limit', '500', '--json', 'headRefOid'];
const prs = spawnSync('gh', [...prList, '-q', '.[].headRefOid'], { cwd: root, encoding: 'utf8' });
const mergedHeads = new Set(prs.status === 0 ? prs.stdout.split('\n').filter(Boolean) : []);
if (prs.status !== 0) console.warn('gh is unavailable, so squash-merged worktrees are kept.\n');

/** `git worktree list --porcelain`: one block per worktree, one `key value` attribute per line. */
const worktrees = git(['worktree', 'list', '--porcelain'], root)
  .split('\n\n')
  .map((block) =>
    Object.fromEntries(
      block.split('\n').map((line) => {
        const space = line.indexOf(' ');
        return space < 0 ? [line, ''] : [line.slice(0, space), line.slice(space + 1)];
      }),
    ),
  )
  .filter((wt) => wt.worktree.startsWith(worktreesDir) && wt.worktree !== current);

/** Claude Code locks a session's worktree with "… (pid N …)"; the lock outlives a crashed session. */
function isStaleLock(reason) {
  const pid = Number(/\bpid (\d+)/.exec(reason)?.[1]);
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return false;
  } catch (error) {
    return error.code === 'ESRCH';
  }
}

/** Worktrees often link the main checkout's node_modules, which `node_modules/` doesn't ignore. */
function sharedNodeModules(path) {
  try {
    return lstatSync(join(path, 'node_modules')).isSymbolicLink();
  } catch {
    return false;
  }
}

function blocker(wt) {
  if ('locked' in wt && !isStaleLock(wt.locked)) return `locked: ${wt.locked || 'no reason'}`;
  const changes = git(['status', '--porcelain'], wt.worktree)
    .split('\n')
    .filter((line) => line && !(line === '?? node_modules' && sharedNodeModules(wt.worktree)));
  if (changes.length > 0) return `${changes.length} uncommitted change(s)`;
  const onMain = spawnSync('git', ['merge-base', '--is-ancestor', wt.HEAD, 'origin/main'], {
    cwd: root,
  });
  if (onMain.status !== 0 && !mergedHeads.has(wt.HEAD)) return 'not merged';
  return null;
}

let removed = 0;
for (const wt of worktrees) {
  const name = basename(wt.worktree);
  const reason = blocker(wt);
  if (reason) {
    console.log(`${'keep'.padEnd(13)} ${name} (${reason})`);
    continue;
  }
  console.log(`${(dryRun ? 'would remove' : 'remove').padEnd(13)} ${name}`);
  removed++;
  if (dryRun) continue;

  if ('locked' in wt) git(['worktree', 'unlock', wt.worktree], root);
  if (sharedNodeModules(wt.worktree)) unlinkSync(join(wt.worktree, 'node_modules'));
  git(['worktree', 'remove', wt.worktree], root);
  if (wt.branch) git(['branch', '-D', wt.branch.replace('refs/heads/', '')], root);
}

console.log(`\n${removed} merged worktree(s) ${dryRun ? 'to remove' : 'removed'}.`);
