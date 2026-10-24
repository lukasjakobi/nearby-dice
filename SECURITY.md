# Security policy

## Reporting a vulnerability

Please report vulnerabilities privately, not in public issues or pull requests. Use GitHub's private
vulnerability reporting: open the repository's **Security** tab and choose **Report a
vulnerability**. Include the affected version or commit, the devices and OS versions involved, and
the steps to reproduce.

We will confirm the report and keep you updated while we work on a fix.

## Scope

Nearby Dice has no backend, no accounts and no internet traffic of its own: phones connect directly
to each other over Google Nearby Connections. Reports about the following parts are in scope:

- **Nearby peers:** anything a phone in radio range can do to a host or guest, such as taking over a
  seat, sending malformed or oversized messages, or tampering with the game state.
- **The native bridge:** the Kotlin and Swift code in `modules/nearby-connections/`, including
  permissions and connection handling.
- **The app:** data stored on the phone, message validation and the release build configuration.

Vulnerabilities in Google Nearby Connections, Expo, React Native or the operating systems themselves
belong with their maintainers. Please let us know anyway if they affect this app, so we can update or
work around them.

## Supported versions

Only the [latest release](https://github.com/lukasjakobi/nearby-dice/releases/latest) receives
security fixes.

## Dependency security fixes

**Confirmed — 2026-10-24:** `package.json` overrides Zod to 4.6.7 and
`decode-uri-component` to 0.5.1 for
[GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) and
[GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr). Expo SDK 57's
`query-string` 7.1.3 consumer needs the decoder's ESM default export, so an install patch adapts
that import. Zod 4 remains compatible with the CLI's plugin schemas and the React Hooks linter.

**Confirmed — 2026-10-24:** `node-forge` has no published fix for
[GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv). The install patch
backports the nested DigestAlgorithm element-count check from
[upstream PR #1152, commit ceba344](https://github.com/digitalbazaar/forge/pull/1152/commits/ceba34402e329f0365134f23fe19898756527d65)
to version 1.4.0, used by Expo's CLI and code-signing tools. The package keeps its real version:
npm audit and Dependabot will continue reporting it until a patched release is available. Do not
dismiss this alert as fixed or change the version to hide it.

`npm ci` runs `patch-package --error-on-fail`; installation must fail if either patch no longer
applies. Do not use `--ignore-scripts`. `npm run check` exercises malformed query parameters,
bounded collection validation, Expo CLI schemas, malformed RSA signatures and Expo signing
against the installed dependencies. The Node subprocess timeout bounds decoder regressions.

**Open:** remove the `node-forge` override and patch when a fixed official release is available.
Remove the decoder override, `query-string` pin and import patch once an Expo SDK 57 update
supports a patched decoder. Remove the Zod override once its consumers require a patched version.
