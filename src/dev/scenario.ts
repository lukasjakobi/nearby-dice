/**
 * Screens the browser harness opens straight away with `/?scenario=<value>`, in dev builds of
 * the web app only (docs/technical-design.md, Browser harness). Each one plays the phone you see
 * plus bots in the same page until the screen is in that state.
 */
export enum Scenario {
  /** A new installation: the first onboarding slide. */
  Onboarding = 'onboarding',
  /** A returning player with statistics and two saved games. */
  Home = 'home',
  Settings = 'settings',
  /** Hosting, with three guests in the lobby. */
  HostLobby = 'host-lobby',
  /** Joined someone else's lobby. */
  GuestLobby = 'guest-lobby',
  /** Three players, my turn, after my first roll. */
  GameMyTurn = 'game-my-turn',
  /** A guest watching the host's turn. */
  GameWaiting = 'game-waiting',
  /** Six players in round four, my turn. */
  GameSixPlayers = 'game-six-players',
  /** A finished game of two. */
  Results = 'results',
  /** A saved game, opened from the home screen. */
  SavedGame = 'saved-game',
  /** Training in round five. */
  Training = 'training',
}

export function isScenario(value: string | null): value is Scenario {
  return Object.values(Scenario).some((scenario) => scenario === value);
}
