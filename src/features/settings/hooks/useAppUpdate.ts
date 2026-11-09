import { useRef, useState } from 'react';

import { downloadApk, fetchLatestRelease, isNewerVersion, openInstaller } from '../services';
import type { Release } from '../services';
import { UpdateAction, UpdateStatus } from '../view';
import type { UpdateState } from '../view';

/** Checks GitHub for a newer release on request, then downloads it and opens the installer. */
export function useAppUpdate(currentVersion: string | undefined) {
  const [state, setState] = useState<UpdateState>({ status: UpdateStatus.Idle });
  const release = useRef<Release | null>(null);

  const check = async () => {
    setState({ status: UpdateStatus.Checking });
    try {
      const latest = await fetchLatestRelease();
      const newer = latest && currentVersion && isNewerVersion(latest.version, currentVersion);
      release.current = newer ? latest : null;
      setState(
        newer
          ? { status: UpdateStatus.Available, version: latest.version }
          : { status: UpdateStatus.UpToDate },
      );
    } catch {
      setState({ status: UpdateStatus.CheckFailed });
    }
  };

  const install = async () => {
    const target = release.current;
    if (!target) return;

    const { version } = target;
    setState({ status: UpdateStatus.Downloading, version, percent: 0 });
    try {
      const apk = await downloadApk(target, (fraction) => {
        const percent = Math.floor(fraction * 100);
        setState((s) =>
          s.status === UpdateStatus.Downloading && s.percent !== percent ? { ...s, percent } : s,
        );
      });
      setState({ status: UpdateStatus.Installing, version });
      await openInstaller(apk);
      // Installing replaces the app, so we only get here when the player cancelled the installer.
      setState({ status: UpdateStatus.Available, version });
    } catch {
      setState({ status: UpdateStatus.DownloadFailed, version });
    }
  };

  const actions: Record<UpdateAction, () => Promise<void>> = {
    [UpdateAction.Check]: check,
    [UpdateAction.Install]: install,
  };

  return { state, run: (action: UpdateAction) => void actions[action]() };
}
