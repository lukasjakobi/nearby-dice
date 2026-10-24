/** All session timings in one place (ms). Proposals from the spec; tune after device tests. */
export const TIMING = {
  countdown: 3500,
  rematchCountdown: 2200,
  trainingCountdown: 2200,
  pingInterval: 2000,
  /** A peer is lost after 3 missed pings. */
  livenessTimeout: 6000,
  /** Bounds a whole join, from the search to the host's answer. */
  joinTimeout: 12000,
  reconnectDelays: [0, 2000, 5000],
  /** Bounds a whole reconnect attempt, like `joinTimeout`. */
  reconnectAttemptTimeout: 8000,
  /** How long the host looks for code collisions before advertising. */
  codeCollisionScan: 1200,
  /** How long nearby-round skeletons show before the empty state. */
  scanWindow: 3000,
  /** Lets a final message leave before the connection closes. */
  closeGrace: 300,
  /** A connection that has not sent HELLO by then is closed. */
  helloTimeout: 5000,
  /** The window for the per-peer message cap. */
  rateWindow: 1000,
} as const;

export const MAX_RECONNECT_ATTEMPTS = TIMING.reconnectDelays.length;
/** Connections that may wait for their HELLO at once; the host refuses more. */
export const MAX_PENDING_ADMISSIONS = 4;
/** Messages a peer may send per `rateWindow` before the host closes its link. */
export const MAX_MESSAGES_PER_WINDOW = 30;
