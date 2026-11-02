import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import { startActivityAsync } from 'expo-intent-launcher';
import { Platform } from 'react-native';

import { parseRelease } from '../view';
import type { Release } from '../view';

// `owner/name`, set at build time by app.config.js.
const repository: unknown = Constants.expoConfig?.extra?.releaseRepository;
const APK_MIME_TYPE = 'application/vnd.android.package-archive';
// Intent.FLAG_GRANT_READ_URI_PERMISSION: lets the system installer read the APK from our cache.
const GRANT_READ_URI = 1;

/**
 * Only release builds on Android can install the APK from a GitHub release. iOS can't sideload, and
 * the `.dev` debug variant has its own package id and signing key, so a release APK wouldn't update it.
 * A build without a release repository has nowhere to look.
 */
export const updatesSupported =
  Platform.OS === 'android' && !__DEV__ && typeof repository === 'string';

export async function fetchLatestRelease(): Promise<Release | null> {
  const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`);

  return parseRelease(await response.json());
}

/**
 * Downloads the APK into the cache, reporting progress as a fraction between 0 and 1. Every
 * download replaces the last one, so old APKs don't pile up.
 */
export async function downloadApk(
  release: Release,
  onProgress: (fraction: number) => void,
): Promise<File> {
  const target = new File(Paths.cache, 'nearby-dice-update.apk');

  return File.downloadFileAsync(release.apkUrl, target, {
    idempotent: true,
    onProgress: ({ bytesWritten, totalBytes }) => {
      if (totalBytes > 0) onProgress(bytesWritten / totalBytes);
    },
  });
}

/** Hands the APK to Android's installer, which asks the player to confirm; resolves when it closes. */
export async function openInstaller(apk: File): Promise<void> {
  await startActivityAsync('android.intent.action.VIEW', {
    data: apk.contentUri,
    type: APK_MIME_TYPE,
    flags: GRANT_READ_URI,
  });
}
