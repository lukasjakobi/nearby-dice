import { Route } from '@/shared/navigation/routes';
import { ConnectionStatus, Role, SessionPhase } from '@/session/types';
import type { SessionSnapshot } from '@/session/types';
import { PresetId } from '@/domain/rules';

import { allowedRoutes } from '../routing';

const snapshot = (role: Role, phase: SessionPhase, gameNumber = 1): SessionSnapshot => ({
  role,
  myId: 'me',
  connection: { status: ConnectionStatus.Connected, attempt: 0 },
  ended: null,
  clockOffset: 0,
  shared: {
    sessionId: 's',
    code: '7K4M',
    roundName: 'R',
    preset: PresetId.Classic,
    maxPlayers: 4,
    allowRejoin: true,
    phase,
    players: [],
    game: null,
    gameNumber,
    rematch: {},
    countdownEndsAt: null,
    hostTime: 0,
    rev: 1,
  },
});

test.each([
  [Role.Host, SessionPhase.Lobby, 1, [Route.HostLobby]],
  [Role.Guest, SessionPhase.Lobby, 1, [Route.GuestLobby]],
  [Role.Host, SessionPhase.Countdown, 1, [Route.Game]],
  [Role.Guest, SessionPhase.Countdown, 1, [Route.GuestLobby]],
  [Role.Guest, SessionPhase.Countdown, 2, [Route.Results]],
  [Role.Guest, SessionPhase.Playing, 1, [Route.Game]],
  [Role.Host, SessionPhase.Finished, 1, [Route.Results, Route.Game]],
  [Role.Training, SessionPhase.Countdown, 1, [Route.Game]],
  [Role.Training, SessionPhase.Countdown, 2, [Route.Game]],
  [Role.Training, SessionPhase.Playing, 1, [Route.Game]],
  [Role.Training, SessionPhase.Finished, 1, [Route.Results, Route.Game]],
])('%s in %s (game %d) → %s', (role, phase, gameNumber, routes) => {
  expect(allowedRoutes(snapshot(role, phase, gameNumber))).toEqual(routes);
});
