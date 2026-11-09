/** The newest published release, as far as the update check needs it. */
export type Release = { version: string; apkUrl: string };

const SEMVER = /^v?(\d+)\.(\d+)\.(\d+)$/;

function parts(version: string): number[] | null {
  const match = SEMVER.exec(version);

  return match ? match.slice(1).map(Number) : null;
}

/** True when `candidate` (`v1.3.0` or `1.3.0`) is a later version than `current`. */
export function isNewerVersion(candidate: string, current: string): boolean {
  const next = parts(candidate);
  const now = parts(current);
  if (!next || !now) return false;

  const diff = next.map((part, i) => part - now[i]!).find((d) => d !== 0) ?? 0;

  return diff > 0;
}

type GitHubRelease = {
  tag_name?: unknown;
  assets?: { name?: unknown; browser_download_url?: unknown }[];
};

/** Reads GitHub's "latest release" response; null when it has no version tag or no APK. */
export function parseRelease(json: unknown): Release | null {
  const release = json as GitHubRelease | null;
  const tag = release?.tag_name;
  if (typeof tag !== 'string' || !parts(tag)) return null;

  const apk = (Array.isArray(release?.assets) ? release.assets : []).find(
    (asset) => typeof asset.name === 'string' && asset.name.endsWith('.apk'),
  );
  if (typeof apk?.browser_download_url !== 'string') return null;

  return { version: tag.replace(/^v/, ''), apkUrl: apk.browser_download_url };
}
