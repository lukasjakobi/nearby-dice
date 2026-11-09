/**
 * The authoritative session on the host's phone. It ties the shared game core to the
 * network: admission and liveness decide who plays, the core runs every move, and
 * each handled event or command broadcasts the full shared state at most once.
 */
import { ActionType, Link, MAX_PLAYERS } from '@/domain';
import type { Category, Focus, GameAction, PlayerId, PresetId, Profile, Rng } from '@/domain';
import { Timers } from '@/lib';
import type { Unsubscribe } from '@/lib';
import { generateRoundCode, PermissionStatus, RadioState, TransportEvent } from '@/net';
import type { PeerId, Transport } from '@/net';

import { AdmissionKind, Seats } from './admission';
import { GameCore, MoveOutcome } from './gameCore';
import { OwnedPeers } from './peerOwnership';
import { PeerLinks } from './peerLinks';
import type { PeerLink } from './peerLinks';
import { CloseReason, MessageType, RejectReason, decode, encode } from './protocol';
import type { Message, MessageOf } from './protocol';
import type { RoundScanner } from './RoundScanner';
import { TIMING } from './timing';
import { EndReason, HostError, RematchVote, Role, SessionPhase } from './types';
import type { HostController, PlayerInfo, SessionSnapshot, SharedSession } from './types';

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

export class HostSession implements HostController {
  readonly role = Role.Host;
  private readonly core: GameCore;
  private readonly links = new PeerLinks();
  private readonly seats = new Seats();
  private readonly owned: OwnedPeers;
  private readonly timers = new Timers();
  /** Final disconnects must outlive the gameplay timers cleared by dispose(). */
  private readonly cleanupTimers = new Timers();
  private readonly unsubscribers: Unsubscribe[];
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
    const { transport } = options;
    this.owned = new OwnedPeers(transport);
    this.core = new GameCore({
      role: Role.Host,
      profile: options.profile,
      settings: {
        code,
        roundName: options.roundName,
        preset: options.preset,
        maxPlayers: MAX_PLAYERS,
        allowRejoin: options.allowRejoin ?? true,
      },
      rng: options.rng,
      publish: () => this.broadcast(),
      onFinish: ({ players }) => ({
        rematch: Object.fromEntries(players.map((p) => [p.id, RematchVote.Pending])),
      }),
    });
    this.unsubscribers = [
      transport.on(TransportEvent.PeerConnected, ({ peerId, authToken }) =>
        this.core.batch(() => this.onPeerConnected(peerId, authToken)),
      ),
      transport.on(TransportEvent.PeerDisconnected, ({ peerId }) =>
        this.core.batch(() => this.onPeerGone(peerId)),
      ),
      transport.on(TransportEvent.Data, ({ peerId, data }) =>
        this.core.batch(() => this.onData(peerId, data)),
      ),
    ];
    this.timers.every(TIMING.pingInterval, () => this.core.batch(() => this.checkLiveness()));
  }

  // ── Reading ──────────────────────────────────────────────────────────────

  getSnapshot = (): SessionSnapshot => this.core.getSnapshot();
  subscribe = (listener: () => void): Unsubscribe => this.core.subscribe(listener);

  private get shared(): SharedSession {
    return this.core.shared;
  }

  private get myId(): PlayerId {
    return this.core.myId;
  }

  // ── Player commands (the host plays too) ─────────────────────────────────

  roll(): void {
    this.core.act({ type: ActionType.Roll, by: this.myId });
  }

  toggleHold(die: number): void {
    this.core.toggleHold(this.myId, die);
  }

  score(category: Category, sheet: number): void {
    this.core.act({ type: ActionType.Score, by: this.myId, category, sheet });
  }

  focus(focus: Focus | null): void {
    this.core.act({ type: ActionType.Focus, by: this.myId, focus });
  }

  viewSheet(sheet: number): void {
    this.core.act({ type: ActionType.ViewSheet, by: this.myId, sheet });
  }

  voteRematch(vote: RematchVote): void {
    this.core.batch(() => this.setVote(this.myId, vote));
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
    this.core.commit({ players: this.shared.players.filter((p) => p.id !== playerId) });
    void this.advertise();
  }

  closeLobby(): void {
    this.end(CloseReason.LobbyClosed, EndReason.LobbyClosed);
  }

  endForAll(): void {
    this.end(CloseReason.GameEnded, EndReason.GameEnded);
  }

  skipTurn(playerId: PlayerId): void {
    this.core.act({ type: ActionType.Skip, playerId });
  }

  removeFromGame(playerId: PlayerId): void {
    if (playerId === this.myId) return;
    this.core.batch(() => {
      this.dropSeat(playerId, { type: MessageType.Kick }, { ban: true });
      this.setLink(playerId, Link.Removed);
      this.core.act({ type: ActionType.Remove, playerId });
    });
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
    if (phase === SessionPhase.Lobby) return this.core.commit({ preset });
    if (phase !== SessionPhase.Finished) return;
    // A yes was given to the old mode; everyone but the host decides again.
    const votes = Object.fromEntries(
      Object.entries(rematch).map(([id, vote]) => [
        id,
        id !== this.myId && vote === RematchVote.Yes ? RematchVote.Pending : vote,
      ]),
    );
    this.core.commit({ preset, rematch: votes });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.timers.clearAll();
    this.core.dispose();
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    void this.options.transport.stopAdvertising();
    if (!this.ending) {
      const peerIds = new Set([...this.links.peerIds(), ...this.seats.peerIds()]);
      for (const peerId of peerIds) this.owned.disconnectIfOwned(peerId);
    }

    this.links.clear();
    this.seats.clear();
    this.owned.clear();
  }

  // ── Game flow ────────────────────────────────────────────────────────────

  private beginGame(players: PlayerInfo[], countdownMs: number): void {
    this.core.beginGame(players, countdownMs);
    void this.advertise();
  }

  /** Applies a guest's move; a rejected one resyncs only that guest. */
  private actFor(peerId: PeerId, action: GameAction): void {
    if (this.core.act(action) === MoveOutcome.Rejected) this.sendState(peerId);
  }

  private setVote(playerId: PlayerId, vote: RematchVote): void {
    const { phase, rematch } = this.shared;
    if (phase !== SessionPhase.Finished || rematch[playerId] === vote) return;
    this.core.commit({ rematch: { ...rematch, [playerId]: vote } });
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
    const link = this.links.open(peerId, authToken, Date.now());
    if (!link) {
      void this.options.transport.disconnect(peerId);

      return;
    }

    this.owned.claim(peerId);
    this.timers.after(TIMING.helloTimeout, () => {
      if (this.links.get(peerId) === link && !link.greeted) this.dropPeer(peerId);
    });
  }

  private onData(peerId: PeerId, data: string): void {
    const link = this.links.get(peerId);
    if (!link) return;
    if (!this.links.withinRate(link, Date.now())) return this.dropPeer(peerId);
    const message = decode(data);
    if (message) this.onMessage(peerId, link, message);
  }

  private onMessage(peerId: PeerId, link: PeerLink, message: Message): void {
    link.lastSeen = Date.now();
    if (message.type === MessageType.Hello) {
      this.onHello(peerId, link, message);

      return;
    }

    const by = link.playerId;
    if (!by) return;
    switch (message.type) {
      case MessageType.Roll:
        return this.actFor(peerId, { type: ActionType.Roll, by });
      case MessageType.Hold:
        return this.actFor(peerId, { type: ActionType.Hold, by, held: message.held });
      case MessageType.Score:
        return this.actFor(peerId, {
          type: ActionType.Score,
          by,
          category: message.category,
          sheet: message.sheet,
        });
      case MessageType.Focus:
        return this.actFor(peerId, { type: ActionType.Focus, by, focus: message.focus });
      case MessageType.ViewSheet:
        return this.actFor(peerId, { type: ActionType.ViewSheet, by, sheet: message.sheet });
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

  private onHello(peerId: PeerId, link: PeerLink, hello: MessageOf<MessageType.Hello>): void {
    if (link.greeted || hello.authToken !== link.authToken) return this.dropPeer(peerId);
    link.greeted = true;
    const admission = this.seats.admit(hello, this.shared);
    switch (admission.kind) {
      case AdmissionKind.Reject:
        return this.reject(peerId, admission.reason);
      case AdmissionKind.Return:
        return this.seat(peerId, link, admission.playerId);
      case AdmissionKind.Join:
        this.core.commit({ players: admission.players });
        this.seat(peerId, link, admission.playerId);
        void this.advertise();
    }
  }

  /** Binds a connection to a player and sends the welcome. */
  private seat(peerId: PeerId, link: PeerLink, playerId: PlayerId): void {
    const { rejoinToken, replaced } = this.seats.bind(playerId, peerId);
    if (replaced) {
      this.forgetPeer(replaced);
      void this.options.transport.disconnect(replaced);
    }

    link.playerId = playerId;
    this.setLink(playerId, Link.Connected);
    const shared = this.stamped();
    link.sentRev = shared.rev;
    this.send(peerId, { type: MessageType.Welcome, playerId, rejoinToken, shared });
  }

  private reject(peerId: PeerId, reason: RejectReason): void {
    this.send(peerId, { type: MessageType.Reject, reason });
    this.timers.after(TIMING.closeGrace, () => this.dropPeer(peerId));
  }

  private onLeave(playerId: PlayerId): void {
    const peerId = this.seats.unbind(playerId);
    if (peerId) {
      this.forgetPeer(peerId);
      void this.options.transport.disconnect(peerId);
    }

    if (this.shared.phase === SessionPhase.Lobby) {
      this.seats.remove(playerId);
      this.core.commit({ players: this.shared.players.filter((p) => p.id !== playerId) });
      void this.advertise();
    } else {
      this.setLink(playerId, Link.Left);
      this.startRematchWhenDecided();
    }
  }

  private onPeerGone(peerId: PeerId): void {
    const playerId = this.links.get(peerId)?.playerId;
    this.forgetPeer(peerId);
    // Unless the seat already moved on to a newer connection.
    if (!playerId || !this.seats.unbind(playerId, peerId)) return;
    const player = this.shared.players.find((p) => p.id === playerId);
    if (player?.link !== Link.Connected) return;
    this.setLink(playerId, Link.Lost);
    this.startRematchWhenDecided();
  }

  private checkLiveness(): void {
    const now = Date.now();
    const { alive, silent } = this.links.sweep(now);
    for (const peerId of silent) this.dropPeer(peerId);
    for (const peerId of alive) this.send(peerId, { type: MessageType.Ping, at: now });
  }

  /** Closes a connection the host gives up on and forgets it like a lost one. */
  private dropPeer(peerId: PeerId): void {
    void this.options.transport.disconnect(peerId);
    this.onPeerGone(peerId);
  }

  private forgetPeer(peerId: PeerId): void {
    this.links.delete(peerId);
    this.owned.forget(peerId);
  }

  /** Sends a final message, closes the connection after a grace period and frees the seat. */
  private dropSeat(playerId: PlayerId, farewell: Message, { ban = false } = {}): void {
    const peerId = this.seats.remove(playerId, { ban });
    if (peerId) {
      this.send(peerId, farewell);
      this.closeAfterGrace(peerId);
    }
  }

  /** Lets the last message go out, then closes the link if this session still owns it. */
  private closeAfterGrace(peerId: PeerId): void {
    const generation = this.owned.generationOf(peerId);
    this.forgetPeer(peerId);
    this.cleanupTimers.after(TIMING.closeGrace, () =>
      this.owned.disconnectIfOwned(peerId, generation),
    );
  }

  private end(reason: CloseReason, ended: EndReason): void {
    if (this.disposed) return;
    this.ending = true;
    for (const playerId of this.seats.playerIds()) {
      this.dropSeat(playerId, { type: MessageType.Close, reason });
    }

    // Connections that have not completed admission still belong to this host.
    // They have no seat to receive a farewell, but must not survive shutdown.
    for (const peerId of this.links.peerIds()) this.closeAfterGrace(peerId);

    this.core.end(ended);
    this.dispose();
  }

  private setLink(playerId: PlayerId, link: Link): void {
    const { players } = this.shared;
    if (players.find((p) => p.id === playerId)?.link === link) return;
    this.core.commit({ players: players.map((p) => (p.id === playerId ? { ...p, link } : p)) });
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

  // ── Sending ──────────────────────────────────────────────────────────────

  private stamped(): SharedSession {
    return { ...this.shared, hostTime: Date.now() };
  }

  private sendState(peerId: PeerId): void {
    const shared = this.stamped();
    const link = this.links.get(peerId);
    if (link) link.sentRev = shared.rev;
    this.send(peerId, { type: MessageType.State, shared });
  }

  /** Sends the full state to every seated peer that doesn't have it yet. */
  private broadcast(): void {
    const shared = this.stamped();
    const message = encode({ type: MessageType.State, shared });
    for (const [peerId, link] of this.links.seated()) {
      if (link.sentRev === shared.rev) continue;
      link.sentRev = shared.rev;
      this.deliver(peerId, message);
    }
  }

  private send(peerId: PeerId, message: Message): void {
    this.deliver(peerId, encode(message));
  }

  /** A send that fails means the link is gone: close it and mark the player lost. */
  private deliver(peerId: PeerId, data: string): void {
    const generation = this.owned.generationOf(peerId);
    void this.options.transport.send(peerId, data).catch(() => {
      if (!this.links.has(peerId) || this.owned.generationOf(peerId) !== generation) return;
      this.core.batch(() => this.dropPeer(peerId));
    });
  }
}
