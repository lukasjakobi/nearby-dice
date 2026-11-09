import { isNewerVersion, parseRelease } from '../services/releases';

describe('isNewerVersion', () => {
  test.each([
    ['v1.3.0', '1.2.9', true],
    ['1.2.10', '1.2.9', true],
    ['v2.0.0', '1.99.99', true],
    ['v1.2.0', '1.2.0', false],
    ['v1.1.9', '1.2.0', false],
    ['nightly', '1.2.0', false],
  ])('%s against installed %s is %s', (candidate, current, expected) => {
    expect(isNewerVersion(candidate, current)).toBe(expected);
  });
});

describe('parseRelease', () => {
  const apk = {
    name: 'nearby-dice-v1.3.0.apk',
    browser_download_url: 'https://github.com/x/y/releases/download/v1.3.0/nearby-dice-v1.3.0.apk',
  };

  test('takes the version from the tag and the first APK asset', () => {
    const json = { tag_name: 'v1.3.0', assets: [{ name: 'notes.txt' }, apk] };

    expect(parseRelease(json)).toEqual({ version: '1.3.0', apkUrl: apk.browser_download_url });
  });

  test('ignores releases without an APK or a version tag', () => {
    expect(parseRelease({ tag_name: 'v1.3.0', assets: [] })).toBeNull();
    expect(parseRelease({ tag_name: 'latest', assets: [apk] })).toBeNull();
    expect(parseRelease(null)).toBeNull();
  });
});
