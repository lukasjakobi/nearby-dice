import type { PermissionStatus, RadioState } from '@/net';
import type { SessionSnapshot } from '@/session';
import type { LoggedError } from '@/store';

/** What "Diagnose kopieren" puts into a bug report. It is for developers, so it is not translated. */
export type DiagnosticsInput = {
  appVersion: string | undefined;
  /** Platform and its version, e.g. `android 36`. */
  os: string;
  session: SessionSnapshot | null;
  permission: PermissionStatus | null;
  radio: RadioState | null;
  /** Newest first, as the error log keeps them. */
  errors: readonly LoggedError[];
};

const indent = (text: string) => text.replace(/^/gm, '    ');

function sessionLines(snapshot: SessionSnapshot | null): string[] {
  if (!snapshot) return ['Session: none'];
  const { shared, connection, ended } = snapshot;

  return [
    `Session: ${snapshot.role}, ${shared.phase}, game ${shared.gameNumber}, ${shared.preset}`,
    `Connection: ${connection.status}, attempt ${connection.attempt}, ended ${ended ?? 'no'}`,
    `Player links: ${shared.players.map((player) => player.link).join(', ')}`,
  ];
}

function errorLines(errors: readonly LoggedError[]): string[] {
  if (errors.length === 0) return ['Recent errors: none'];

  return [
    'Recent errors:',
    ...errors.flatMap((error) => [
      `- ${new Date(error.at).toISOString()}${error.fatal ? ' fatal' : ''} ${error.message}`,
      ...[error.stack, error.componentStack].filter((stack) => stack !== null).map(indent),
    ]),
  ];
}

/** Plain text a player pastes into a bug report; it names no player. */
export function buildDiagnostics(input: DiagnosticsInput): string {
  return [
    `Nearby Dice ${input.appVersion ?? 'unknown'}`,
    `OS: ${input.os}`,
    ...sessionLines(input.session),
    `Transport: permission ${input.permission ?? 'unknown'}, radio ${input.radio ?? 'unknown'}`,
    ...errorLines(input.errors),
  ].join('\n');
}
