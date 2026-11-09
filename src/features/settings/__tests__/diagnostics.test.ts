import { PermissionStatus, RadioState } from '@/net';
import { Link } from '@/domain';
import { ConnectionStatus, Role, SessionPhase } from '@/session';
import { ANTONIA, LUKAS, snapshot } from '@/test/fixtures';

import { buildDiagnostics } from '../view';
import type { DiagnosticsInput } from '../view/diagnostics';

const BASE: DiagnosticsInput = {
  appVersion: '1.2.0',
  os: 'android 36',
  session: null,
  permission: PermissionStatus.Granted,
  radio: RadioState.Ready,
  errors: [],
};

test('without a session or errors it reports the app, OS and radio', () => {
  expect(buildDiagnostics(BASE)).toBe(
    [
      'Nearby Dice 1.2.0',
      'OS: android 36',
      'Session: none',
      'Transport: permission granted, radio ready',
      'Recent errors: none',
    ].join('\n'),
  );
});

test('a session reports role, phase, connection and links, but no player names', () => {
  const text = buildDiagnostics({
    ...BASE,
    session: snapshot({
      role: Role.Guest,
      phase: SessionPhase.Playing,
      players: [LUKAS, { ...ANTONIA, link: Link.Lost }],
      connection: { status: ConnectionStatus.Reconnecting, attempt: 2 },
    }),
  });

  expect(text).toContain('Session: guest, playing, game 1, classic');
  expect(text).toContain('Connection: reconnecting, attempt 2, ended no');
  expect(text).toContain(`Player links: ${LUKAS.link}, lost`);
  expect(text).not.toContain(LUKAS.name);
});

test('errors are listed with their time and indented stacks', () => {
  const text = buildDiagnostics({
    ...BASE,
    errors: [
      {
        at: Date.UTC(2026, 10, 9, 12),
        message: 'Error: board broke',
        stack: 'Error: board broke\nat Board',
        componentStack: null,
        fatal: true,
      },
    ],
  });

  expect(text).toContain(
    'Recent errors:\n- 2026-11-09T12:00:00.000Z fatal Error: board broke\n' +
      '    Error: board broke\n    at Board',
  );
});
