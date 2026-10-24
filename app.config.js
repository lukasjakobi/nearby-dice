const { version: packageVersion } = require('./package.json');

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

// Release builds get the tag (`v1.2.3`) from CI; local and branch builds use package.json.
function appVersion() {
  const tag = process.env.NEARBY_DICE_VERSION;

  return tag ? tag.replace(/^v/, '') : packageVersion;
}

// Two digits each for minor and patch: 1.2.3 becomes 10203, so every release can install over the
// one before it.
function versionCode(version) {
  const match = SEMVER.exec(version);
  if (!match) {
    throw new Error(`Nearby Dice version must be major.minor.patch, got "${version}"`);
  }

  const [major, minor, patch] = match.slice(1).map(Number);
  if (minor > 99 || patch > 99) {
    throw new Error(`Nearby Dice version ${version} needs minor and patch below 100`);
  }

  return major * 10000 + minor * 100 + patch;
}

// Adds the version to app.json, which holds the rest of the config.
module.exports = ({ config }) => {
  const version = appVersion();

  return {
    ...config,
    version,
    android: { ...config.android, versionCode: versionCode(version) },
    ios: { ...config.ios, buildNumber: version },
  };
};
