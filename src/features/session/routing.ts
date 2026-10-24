import { Role, SessionPhase } from '@/session';
import type { SessionSnapshot } from '@/session';
import { Route } from '@/shared';

/**
 * The screens a session may show, given the snapshot; the first one is where the
 * app moves when the current screen is not allowed. Navigation follows state; the
 * one timed move is the game screen handing over to the results.
 */
export function allowedRoutes(snapshot: SessionSnapshot): Route[] {
  const { phase, gameNumber } = snapshot.shared;
  // Training follows the host's screens; it never reaches the lobby.
  const host = snapshot.role !== Role.Guest;
  switch (phase) {
    case SessionPhase.Lobby:
      return [host ? Route.HostLobby : Route.GuestLobby];
    case SessionPhase.Countdown:
      // Guests count down in the lobby for the first game and on the results for a rematch.
      if (host) return [Route.Game];

      return [gameNumber > 1 ? Route.Results : Route.GuestLobby];
    case SessionPhase.Playing:
      return [Route.Game];
    case SessionPhase.Finished:
      // The game screen stays a beat so the last entry can be seen, then moves on itself.
      return [Route.Results, Route.Game];
  }
}
