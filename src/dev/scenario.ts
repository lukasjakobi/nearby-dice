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
  /** Just onboarded: no games, no statistics yet. */
  HomeNew = 'home-new',
  /** Join, with someone's round showing up nearby. */
  JoinNearby = 'join-nearby',
  Settings = 'settings',
  /** Editing a returning player's name and colour. */
  Profile = 'profile',
  HostSetup = 'host-setup',
  TrainingSetup = 'training-setup',
  /** Searching nearby with no rounds available. */
  JoinEmpty = 'join-empty',
  /** Hosting, with three guests in the lobby. */
  HostLobby = 'host-lobby',
  /** Hosting, nobody has joined yet. */
  HostLobbyAlone = 'host-lobby-alone',
  /** Joined someone else's lobby. */
  GuestLobby = 'guest-lobby',
  /** Three players, my turn, after my first roll. */
  GameMyTurn = 'game-my-turn',
  /** Classic XL, my turn after rolling. */
  GameClassicXl = 'game-classic-xl',
  /** A guest watching the host's turn. */
  GameWaiting = 'game-waiting',
  /** My turn before rolling, with the scorecard still locked. */
  GameBeforeRoll = 'game-before-roll',
  /** My turn with two dice held after the first roll. */
  GameHeldDice = 'game-held-dice',
  /** No rolls left: a field must be chosen. */
  GameLastRoll = 'game-last-roll',
  /** My turn with Chance still open: the last field, in the board's corner. Tap it to select. */
  GameChanceOpen = 'game-chance-open',
  /** A guest disconnected on their turn; the host can wait, skip or remove them. */
  GamePlayerLost = 'game-player-lost',
  GameTopToBottom = 'game-top-to-bottom',
  GameBlitz = 'game-blitz',
  GameSameDice = 'game-same-dice',
  GameTriple = 'game-triple',
  GameYatzy = 'game-yatzy',
  GameLuckyNumber = 'game-lucky-number',
  /** Six players in round four, my turn. */
  GameSixPlayers = 'game-six-players',
  /** A finished game of two. */
  Results = 'results',
  /** A finished game of four. */
  ResultsFourPlayers = 'results-four-players',
  /** Results seen by a guest, with read-only preset selection. */
  ResultsGuest = 'results-guest',
  /** Host voted yes, still waiting for the guests. */
  ResultsRematch = 'results-rematch',
  /** Training has its own summary and restart action. */
  ResultsTraining = 'results-training',
  /** A saved game, opened from the home screen. */
  SavedGame = 'saved-game',
  /** Training in round five. */
  Training = 'training',
}

export function isScenario(value: string | null): value is Scenario {
  return Object.values(Scenario).some((scenario) => scenario === value);
}
