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
