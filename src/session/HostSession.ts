/**
 * The authoritative session on the host's phone: admits guests, runs the game
 * engine, enforces every rule, and broadcasts the full shared state after each change.
 */
import { ActionType, createGame, Link, MAX_PLAYERS, PRESETS, randomSeed, reduce } from '@/domain';
import type {
  Category,
  Focus,
  GameAction,
  GameState,
  Held,
  PlayerId,
  PresetId,
  Profile,
  Rng,
} from '@/domain';
import { randomId, secureRandomId, Store, Timers } from '@/lib';
import type { Unsubscribe } from '@/lib';
import { generateRoundCode, PermissionStatus, RadioState, TransportEvent } from '@/net';
import type { PeerId, Transport } from '@/net';

import { CloseReason, MessageType, RejectReason, decode, encode } from './protocol';
import type { Message, MessageOf } from './protocol';
import type { RoundScanner } from './RoundScanner';
import { MAX_MESSAGES_PER_WINDOW, MAX_PENDING_ADMISSIONS, TIMING } from './timing';
import { ConnectionStatus, EndReason, HostError, RematchVote, Role, SessionPhase } from './types';
import type { HostController, PlayerInfo, SessionSnapshot, SharedSession } from './types';
import { claimPeer, isPeerOwner } from './peerOwnership';

export class HostOpenError extends Error {
  constructor(readonly reason: HostError) {
    super(`Could not open lobby: ${reason}`);
  }
}

export type HostOptions = {
  transport: Transport;
  scanner: RoundScanner;
  profile: Profile;
  roundName: string;
  preset: PresetId;
  allowRejoin?: boolean;
  rng?: Rng;
};

type Peer = {
  authToken: string;
  playerId: PlayerId | null;
  /** HELLO was answered: each connection is admitted at most once. */
  greeted: boolean;
  lastSeen: number;
  /** Start of the current rate window and the messages received in it. */
  windowStart: number;
  windowMessages: number;
};
type Seat = { rejoinToken: string; deviceId: string; peerId: PeerId | null };

export class HostSession implements HostController {
  readonly role = Role.Host;
  private readonly store: Store<SessionSnapshot>;
  private readonly peers = new Map<PeerId, Peer>();
  private readonly peerGenerations = new Map<PeerId, number>();
  private readonly seats = new Map<PlayerId, Seat>();
  private readonly bannedDevices = new Set<string>();
  private readonly timers = new Timers();
  /** Final disconnects must outlive the gameplay timers cleared by dispose(). */
  private readonly cleanupTimers = new Timers();
  private readonly unsubscribers: Unsubscribe[];
  private readonly rng: Rng;
  private cancelTurnTimer: (() => void) | null = null;
  private disposed = false;
  private ending = false;

  /** Checks radio and permission, picks an unused code, and starts advertising. */
  static async open(options: HostOptions): Promise<HostSession> {
    const { transport, scanner } = options;
    let permission = await transport.getPermission();
    if (permission === PermissionStatus.Denied) permission = await transport.requestPermission();
    if (permission !== PermissionStatus.Granted)
      throw new HostOpenError(HostError.PermissionMissing);
    const radio = await transport.getRadioState();
    if (radio === RadioState.BluetoothOff) {
      throw new HostOpenError(HostError.BluetoothOff);
    }

    if (radio === RadioState.LocationOff) {
      throw new HostOpenError(HostError.LocationOff);
    }

    const taken = await scanner.collectCodes(TIMING.codeCollisionScan);
    let code = generateRoundCode(options.rng);
    while (taken.has(code)) code = generateRoundCode(options.rng);

    const session = new HostSession(options, code);
    try {
      await session.advertise();
    } catch (error) {
      session.dispose();
      throw error;
    }

    return session;
  }

  private constructor(
    private readonly options: HostOptions,
    code: string,
  ) {
    this.rng = options.rng ?? Math.random;
    const me: PlayerInfo = {
      id: randomId(),
      name: options.profile.name,
      color: options.profile.color,
      isHost: true,
      link: Link.Connected,
    };
    this.store = new Store<SessionSnapshot>({
      role: Role.Host,
      myId: me.id,
      connection: { status: ConnectionStatus.Connected, attempt: 0 },
      ended: null,
      clockOffset: 0,
      shared: {
        sessionId: randomId(),
        code,
        roundName: options.roundName,
        preset: options.preset,
        maxPlayers: MAX_PLAYERS,
        allowRejoin: options.allowRejoin ?? true,
        phase: SessionPhase.Lobby,
        players: [me],
        game: null,
        gameNumber: 0,
        rematch: {},
        countdownEndsAt: null,
        hostTime: Date.now(),
        rev: 1,
      },
    });
    const { transport } = options;
    this.unsubscribers = [
      transport.on(TransportEvent.PeerConnected, ({ peerId, authToken }) =>
        this.onPeerConnected(peerId, authToken),
      ),
      transport.on(TransportEvent.PeerDisconnected, ({ peerId }) => this.onPeerGone(peerId)),
      transport.on(TransportEvent.Data, ({ peerId, data }) => this.onData(peerId, data)),
    ];
    this.timers.every(TIMING.pingInterval, () => this.checkLiveness());
  }

  // ── Reading ──────────────────────────────────────────────────────────────

  getSnapshot = (): SessionSnapshot => this.store.get();
  subscribe = (listener: () => void): Unsubscribe => this.store.subscribe(listener);

  private get shared(): SharedSession {
    return this.store.get().shared;
  }

  private get myId(): PlayerId {
    return this.store.get().myId;
  }

  // ── Player commands (the host plays too) ─────────────────────────────────

  roll(): void {
    this.act({ type: ActionType.Roll, by: this.myId });
  }

  toggleHold(die: number): void {
    const held = this.shared.game?.turn.held;
    if (!held) return;
    const next = held.map((h, i) => (i === die ? !h : h)) as unknown as Held;
    this.act({ type: ActionType.Hold, by: this.myId, held: next });
  }

  score(category: Category, sheet: number): void {
    this.act({ type: ActionType.Score, by: this.myId, category, sheet });
  }

  focus(focus: Focus | null): void {
    this.act({ type: ActionType.Focus, by: this.myId, focus });
  }

  viewSheet(sheet: number): void {
    this.act({ type: ActionType.ViewSheet, by: this.myId, sheet });
  }

  voteRematch(vote: RematchVote): void {
    this.setVote(this.myId, vote);
  }

  leave(): void {
    if (this.shared.phase === SessionPhase.Lobby) this.closeLobby();
    else this.endForAll();
  }

  // ── Host commands ────────────────────────────────────────────────────────

  start(): void {
    const { phase, players } = this.shared;
    const everyoneHere = players.every((p) => p.link === Link.Connected);
    if (phase !== SessionPhase.Lobby || players.length < 2 || !everyoneHere) return;
    this.beginGame(players, TIMING.countdown);
  }

  kick(playerId: PlayerId): void {
    if (this.shared.phase !== SessionPhase.Lobby || playerId === this.myId) return;
    this.dropSeat(playerId, { type: MessageType.Kick }, { ban: true });
    this.commit({ players: this.shared.players.filter((p) => p.id !== playerId) });
    void this.advertise();
  }

  closeLobby(): void {
    this.end(CloseReason.LobbyClosed, EndReason.LobbyClosed);
  }

  endForAll(): void {
    this.end(CloseReason.GameEnded, EndReason.GameEnded);
  }

  skipTurn(playerId: PlayerId): void {
    this.act({ type: ActionType.Skip, playerId });
  }

  removeFromGame(playerId: PlayerId): void {
    if (playerId === this.myId) return;
    this.dropSeat(playerId, { type: MessageType.Kick }, { ban: true });
    this.setLink(playerId, Link.Removed);
    this.act({ type: ActionType.Remove, playerId });
  }

  /** Starts a new game with everyone who voted yes; the others leave the session. */
  startRematch(): void {
    const { phase, players, rematch } = this.shared;
    if (phase !== SessionPhase.Finished) return;
    const stays = (p: PlayerInfo) =>
      p.isHost || (rematch[p.id] === RematchVote.Yes && p.link === Link.Connected);
    if (players.filter(stays).length < 2) return;
    for (const player of players.filter((p) => !stays(p))) {
      this.dropSeat(player.id, { type: MessageType.Close, reason: CloseReason.GameEnded });
    }

    this.beginGame(players.filter(stays), TIMING.rematchCountdown);
  }

  setPreset(preset: PresetId): void {
    const { phase, rematch, preset: current } = this.shared;
    if (preset === current) return;
    if (phase === SessionPhase.Lobby) return this.commit({ preset });
    if (phase !== SessionPhase.Finished) return;
    // A yes was given to the old mode; everyone but the host decides again.
    const votes = Object.fromEntries(
      Object.entries(rematch).map(([id, vote]) => [
        id,
        id !== this.myId && vote === RematchVote.Yes ? RematchVote.Pending : vote,
      ]),
    );
    this.commit({ preset, rematch: votes });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.timers.clearAll();
    this.cancelTurnTimer?.();
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    void this.options.transport.stopAdvertising();
    if (!this.ending) {
      const peerIds = new Set([...this.peers.keys()]);
      for (const seat of this.seats.values()) if (seat.peerId) peerIds.add(seat.peerId);
      for (const peerId of peerIds) {
        const generation = this.peerGenerations.get(peerId);
        if (generation !== undefined && isPeerOwner(this.options.transport, peerId, generation)) {
          void this.options.transport.disconnect(peerId);
        }
      }
    }

    this.peers.clear();
    this.seats.clear();
    this.peerGenerations.clear();
  }

  // ── Game flow ────────────────────────────────────────────────────────────

  private beginGame(players: PlayerInfo[], countdownMs: number): void {
    const startsAt = Date.now() + countdownMs;
    const game = createGame({
      rules: PRESETS[this.shared.preset],
      playerIds: players.map((p) => p.id),
      hostId: this.myId,
      seed: randomSeed(this.rng),
      ctx: { now: startsAt, rng: this.rng },
    });
    this.commit({
      phase: SessionPhase.Countdown,
      players,
      game,
      gameNumber: this.shared.gameNumber + 1,
      rematch: {},
      countdownEndsAt: startsAt,
    });
    void this.advertise();
    this.timers.after(countdownMs, () => {
      this.commit({ phase: SessionPhase.Playing, countdownEndsAt: null });
      this.scheduleTurnTimer();
    });
  }

  /** Applies a move; `from` is the guest's connection, which a rejected intent resyncs. */
  private act(action: GameAction, from?: PeerId): void {
    const { game, phase } = this.shared;
    if (!game || phase !== SessionPhase.Playing) return;
    const result = reduce(game, action, { now: Date.now(), rng: this.rng });
    if (result.rejected) {
      if (from) this.send(from, { type: MessageType.State, shared: this.stamped() });

      return;
    }

    if (result.state === game) return; // a no-op, e.g. the page that is already open
    this.applyGame(result.state);
  }

  private applyGame(game: GameState): void {
    if (!game.finished) {
      this.commit({ game });
      this.scheduleTurnTimer();

      return;
    }

    const rematch = Object.fromEntries(this.shared.players.map((p) => [p.id, RematchVote.Pending]));
    this.cancelTurnTimer?.();
    this.commit({ game, phase: SessionPhase.Finished, rematch });
  }

  private scheduleTurnTimer(): void {
    this.cancelTurnTimer?.();
    const deadline = this.shared.game?.turn.deadline;
    if (!deadline) return;
    this.cancelTurnTimer = this.timers.after(Math.max(0, deadline - Date.now()), () =>
      this.act({ type: ActionType.Timeout }),
    );
  }

  private setVote(playerId: PlayerId, vote: RematchVote): void {
    const { phase, rematch } = this.shared;
    if (phase !== SessionPhase.Finished || rematch[playerId] === vote) return;
    this.commit({ rematch: { ...rematch, [playerId]: vote } });
    this.startRematchWhenDecided();
  }

  /**
   * Everyone votes alike, the host included. Once every connected player has
   * decided and the host plus someone else are in, the rematch starts by itself.
   */
  private startRematchWhenDecided(): void {
    const { phase, players, rematch } = this.shared;
    if (phase !== SessionPhase.Finished || rematch[this.myId] !== RematchVote.Yes) return;
    const connected = players.filter((p) => p.isHost || p.link === Link.Connected);
    if (connected.some((p) => rematch[p.id] === RematchVote.Pending)) return;
    if (connected.filter((p) => rematch[p.id] === RematchVote.Yes).length < 2) return;
    this.startRematch();
  }

  // ── Network ──────────────────────────────────────────────────────────────

  private onPeerConnected(peerId: PeerId, authToken: string): void {
    const pending = [...this.peers.values()].filter((peer) => !peer.greeted).length;
    if (pending >= MAX_PENDING_ADMISSIONS) {
      void this.options.transport.disconnect(peerId);

      return;
    }

    const now = Date.now();
    const peer: Peer = {
      authToken,
      playerId: null,
      greeted: false,
      lastSeen: now,
      windowStart: now,
      windowMessages: 0,
    };
    this.peerGenerations.set(peerId, claimPeer(this.options.transport, peerId));
    this.peers.set(peerId, peer);
    this.timers.after(TIMING.helloTimeout, () => {
      if (this.peers.get(peerId) === peer && !peer.greeted) this.dropPeer(peerId);
    });
  }

  private onData(peerId: PeerId, data: string): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    const now = Date.now();
    if (now - peer.windowStart >= TIMING.rateWindow) {
      peer.windowStart = now;
      peer.windowMessages = 0;
    }

    if (++peer.windowMessages > MAX_MESSAGES_PER_WINDOW) return this.dropPeer(peerId);
    const message = decode(data);
    if (message) this.onMessage(peerId, peer, message);
  }

  private onMessage(peerId: PeerId, peer: Peer, message: Message): void {
    peer.lastSeen = Date.now();
    if (message.type === MessageType.Hello) {
      this.onHello(peerId, peer, message);

      return;
    }

    const by = peer.playerId;
    if (!by) return;
    switch (message.type) {
      case MessageType.Roll:
        return this.act({ type: ActionType.Roll, by }, peerId);
      case MessageType.Hold:
        return this.act({ type: ActionType.Hold, by, held: message.held }, peerId);
      case MessageType.Score:
        return this.act(
          { type: ActionType.Score, by, category: message.category, sheet: message.sheet },
          peerId,
        );
      case MessageType.Focus:
        return this.act({ type: ActionType.Focus, by, focus: message.focus }, peerId);
      case MessageType.ViewSheet:
        return this.act({ type: ActionType.ViewSheet, by, sheet: message.sheet }, peerId);
      case MessageType.Vote:
        return this.setVote(by, message.vote);
      case MessageType.Leave:
        return this.onLeave(by);
      case MessageType.Ping:
        return this.send(peerId, { type: MessageType.Pong, at: message.at });
      default:
        return;
    }
  }

  private onHello(peerId: PeerId, peer: Peer, hello: MessageOf<MessageType.Hello>): void {
    if (peer.greeted || hello.authToken !== peer.authToken) return this.dropPeer(peerId);
    peer.greeted = true;
    const { phase, players, maxPlayers, allowRejoin } = this.shared;
    if (this.bannedDevices.has(hello.deviceId)) return this.reject(peerId, RejectReason.Removed);

    // Only the session's rejoin token returns a seat; a device ID alone never does.
    const returning = [...this.seats].find(
      ([, seat]) => seat.rejoinToken === hello.rejoinToken && seat.deviceId === hello.deviceId,
    );
    if (returning) {
      const [playerId] = returning;
      const player = players.find((p) => p.id === playerId);
      if (!player || player.link === Link.Removed) return this.reject(peerId, RejectReason.Removed);
      if (phase !== SessionPhase.Lobby && !allowRejoin)
        return this.reject(peerId, RejectReason.Removed);

      return this.seat(peerId, peer, playerId);
    }

    if (phase !== SessionPhase.Lobby) return this.reject(peerId, RejectReason.Started);
    // A device that lost its lobby link without its token (e.g. after an app restart)
    // joins anew, and its orphaned seat makes room.
    const orphan = [...this.seats].find(
      ([, seat]) => seat.deviceId === hello.deviceId && !seat.peerId,
    )?.[0];
    const others = players.filter((p) => p.id !== orphan);
    if (others.length >= maxPlayers) return this.reject(peerId, RejectReason.Full);
    if (orphan) this.seats.delete(orphan);

    const player: PlayerInfo = {
      id: randomId(),
      name: hello.profile.name,
      color: hello.profile.color,
      isHost: false,
      link: Link.Connected,
    };
    this.seats.set(player.id, {
      rejoinToken: secureRandomId(),
      deviceId: hello.deviceId,
      peerId: null,
    });
    this.commit({ players: [...others, player] });
    this.seat(peerId, peer, player.id);
    void this.advertise();
  }

  /** Binds a connection to a player and sends the welcome. */
  private seat(peerId: PeerId, peer: Peer, playerId: PlayerId): void {
    const seat = this.seats.get(playerId)!;
    if (seat.peerId && seat.peerId !== peerId) {
      this.peers.delete(seat.peerId);
      void this.options.transport.disconnect(seat.peerId);
    }

    seat.peerId = peerId;
    peer.playerId = playerId;
    this.setLink(playerId, Link.Connected);
    this.send(peerId, {
      type: MessageType.Welcome,
      playerId,
      rejoinToken: seat.rejoinToken,
      shared: this.stamped(),
    });
  }

  private reject(peerId: PeerId, reason: RejectReason): void {
    this.send(peerId, { type: MessageType.Reject, reason });
    this.timers.after(TIMING.closeGrace, () => this.dropPeer(peerId));
  }

  private onLeave(playerId: PlayerId): void {
    const seat = this.seats.get(playerId);
    if (seat?.peerId) {
      this.peers.delete(seat.peerId);
      void this.options.transport.disconnect(seat.peerId);
      seat.peerId = null;
    }

    if (this.shared.phase === SessionPhase.Lobby) {
      this.seats.delete(playerId);
      this.commit({ players: this.shared.players.filter((p) => p.id !== playerId) });
      void this.advertise();
    } else {
      this.setLink(playerId, Link.Left);
      this.startRematchWhenDecided();
    }
  }

  private onPeerGone(peerId: PeerId): void {
    const peer = this.peers.get(peerId);
    this.peers.delete(peerId);
    if (!peer?.playerId) return;
    const seat = this.seats.get(peer.playerId);
    if (seat?.peerId !== peerId) return; // already re-seated on a newer connection
    seat.peerId = null;
    const player = this.shared.players.find((p) => p.id === peer.playerId);
    if (player?.link !== Link.Connected) return;
    this.setLink(peer.playerId, Link.Lost);
    this.startRematchWhenDecided();
  }

  private checkLiveness(): void {
    const now = Date.now();
    for (const [peerId, peer] of this.peers) {
      if (!peer.playerId) continue;
      if (now - peer.lastSeen > TIMING.livenessTimeout) {
        void this.options.transport.disconnect(peerId);
        this.onPeerGone(peerId);
      } else {
        this.send(peerId, { type: MessageType.Ping, at: now });
      }
    }
  }

  /** Closes a connection the host gives up on and forgets it like a lost one. */
  private dropPeer(peerId: PeerId): void {
    void this.options.transport.disconnect(peerId);
    this.onPeerGone(peerId);
  }

  /** Sends a final message, closes the connection and forgets the seat. */
  private dropSeat(playerId: PlayerId, farewell: Message, { ban = false } = {}): void {
    const seat = this.seats.get(playerId);
    if (!seat) return;
    if (ban) this.bannedDevices.add(seat.deviceId);
    if (seat.peerId) {
      const peerId = seat.peerId;
      const generation = this.peerGenerations.get(peerId);
      this.send(peerId, farewell);
      this.peers.delete(peerId);
      this.cleanupTimers.after(TIMING.closeGrace, () => {
        if (generation !== undefined && isPeerOwner(this.options.transport, peerId, generation)) {
          void this.options.transport.disconnect(peerId);
        }
      });
    }

    this.seats.delete(playerId);
  }

  private end(reason: CloseReason, ended: EndReason): void {
    if (this.disposed) return;
    this.ending = true;
    for (const playerId of [...this.seats.keys()]) {
      this.dropSeat(playerId, { type: MessageType.Close, reason });
    }

    // Connections that have not completed admission still belong to this host.
    // They have no seat to receive a farewell, but must not survive shutdown.
    for (const peerId of this.peers.keys()) {
      const generation = this.peerGenerations.get(peerId);
      this.cleanupTimers.after(TIMING.closeGrace, () => {
        if (generation !== undefined && isPeerOwner(this.options.transport, peerId, generation)) {
          void this.options.transport.disconnect(peerId);
        }
      });
    }

    this.store.update((s) => ({ ...s, ended }));
    this.dispose();
  }

  private setLink(playerId: PlayerId, link: Link): void {
    const players = this.shared.players.map((p) => (p.id === playerId ? { ...p, link } : p));
    this.commit({ players });
  }

  private advertise(): Promise<void> {
    const { code, roundName, players, maxPlayers } = this.shared;
    const me = players.find((p) => p.isHost)!;

    return this.options.transport.startAdvertising({
      code,
      roundName,
      hostName: me.name,
      hostColor: me.color,
      players: players.filter((p) => p.link !== Link.Removed).length,
      maxPlayers,
    });
  }

  // ── State ────────────────────────────────────────────────────────────────

  private stamped(): SharedSession {
    return { ...this.shared, hostTime: Date.now() };
  }

  private commit(patch: Partial<SharedSession>): void {
    this.store.update((s) => ({ ...s, shared: { ...s.shared, ...patch, rev: s.shared.rev + 1 } }));
    this.broadcast();
  }

  private broadcast(): void {
    const message = encode({ type: MessageType.State, shared: this.stamped() });
    for (const [peerId, peer] of this.peers) {
      if (peer.playerId) this.deliver(peerId, message);
    }
  }

  private send(peerId: PeerId, message: Message): void {
    this.deliver(peerId, encode(message));
  }

  /** A send that fails means the link is gone: close it and mark the player lost. */
  private deliver(peerId: PeerId, data: string): void {
    const generation = this.peerGenerations.get(peerId);
    void this.options.transport.send(peerId, data).catch(() => {
      if (!this.peers.has(peerId) || this.peerGenerations.get(peerId) !== generation) return;
      void this.options.transport.disconnect(peerId);
      this.onPeerGone(peerId);
    });
  }
}
