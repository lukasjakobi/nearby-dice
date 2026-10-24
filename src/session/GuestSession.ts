/**
 * A guest's view of a round. Sends intents to the host and replaces its copy of
 * the shared state with every broadcast. Reconnects on its own when the link drops.
 */
import type { Category, Focus, Held, Profile } from '@/domain';
import { AbortedError, delay, Store, Timers } from '@/lib';
import type { Unsubscribe } from '@/lib';
import { TransportEvent } from '@/net';
import type { PeerId, Transport } from '@/net';

import { JoinFailedError, checkRadio, handshake } from './handshake';
import type { HandshakeResult } from './handshake';
import { CloseReason, MessageType, decode, encode } from './protocol';
import type { Message } from './protocol';
import type { RoundScanner } from './RoundScanner';
import { MAX_RECONNECT_ATTEMPTS, TIMING } from './timing';
import { ConnectionStatus, EndReason, JoinError, Role } from './types';
import { claimPeer, isPeerOwner } from './peerOwnership';
import type {
  GuestController,
  JoinStep,
  RematchVote,
  SessionSnapshot,
  SharedSession,
} from './types';

export type GuestOptions = {
  transport: Transport;
  scanner: RoundScanner;
  deviceId: string;
  profile: Profile;
};

const CLOSE_TO_END: Record<CloseReason, EndReason> = {
  [CloseReason.LobbyClosed]: EndReason.LobbyClosed,
  [CloseReason.GameEnded]: EndReason.GameEnded,
};

export class GuestSession implements GuestController {
  readonly role = Role.Guest;
  readonly rejoinToken: string;
  private readonly store: Store<SessionSnapshot>;
  private readonly timers = new Timers();
  /** Keeps the voluntary-leave disconnect alive after session disposal. */
  private readonly cleanupTimers = new Timers();
  private readonly ownedPeers = new Set<PeerId>();
  private readonly peerGenerations = new Map<PeerId, number>();
  private readonly unsubscribers: Unsubscribe[];
  private peerId: PeerId | null;
  private lastHeard = Date.now();
  private reconnecting: AbortController | null = null;
  private disposed = false;

  /** Joins a round by code. Throws `JoinFailedError` with a `JoinError`. */
  static async join(
    options: GuestOptions & {
      code: string;
      onStep?: (step: JoinStep) => void;
      signal?: AbortSignal;
    },
  ): Promise<GuestSession> {
    await checkRadio(options.transport);
    const result = await handshake({ ...options, rejoinToken: null });

    return new GuestSession(options, result);
  }

  /** Returns to an interrupted session ("Fortsetzen"), trying up to three times. */
  static async resume(
    options: GuestOptions & {
      code: string;
      rejoinToken: string;
      onAttempt?: (attempt: number) => void;
      signal?: AbortSignal;
    },
  ): Promise<GuestSession> {
    await checkRadio(options.transport);
    let lastError: unknown = new JoinFailedError(JoinError.NotFound);
    for (let attempt = 1; attempt <= MAX_RECONNECT_ATTEMPTS; attempt++) {
      options.onAttempt?.(attempt);
      await delay(TIMING.reconnectDelays[attempt - 1], options.signal);
      try {
        const result = await handshake({
          ...options,
          timeout: TIMING.reconnectAttemptTimeout,
        });

        return new GuestSession(options, result);
      } catch (error) {
        if (error instanceof AbortedError) throw error;
        if (error instanceof JoinFailedError && error.reason !== JoinError.NotFound) throw error;
        lastError = error;
      }
    }

    throw lastError;
  }

  private constructor(
    private readonly options: GuestOptions,
    { peerId, welcome }: HandshakeResult,
  ) {
    this.peerId = peerId;
    this.ownedPeers.add(peerId);
    this.peerGenerations.set(peerId, claimPeer(options.transport, peerId));
    this.rejoinToken = welcome.rejoinToken;
    this.store = new Store<SessionSnapshot>({
      role: Role.Guest,
      myId: welcome.playerId,
      shared: welcome.shared,
      connection: { status: ConnectionStatus.Connected, attempt: 0 },
      ended: null,
      clockOffset: Date.now() - welcome.shared.hostTime,
    });
    const { transport } = options;
    this.unsubscribers = [
      transport.on(TransportEvent.Data, ({ peerId: from, data }) => {
        if (from !== this.peerId) return;
        const message = decode(data);
        if (message) this.onMessage(message);
      }),
      transport.on(TransportEvent.PeerDisconnected, ({ peerId: gone }) => {
        if (gone === this.peerId) this.onHostLost();
      }),
    ];
    this.timers.every(TIMING.pingInterval, () => {
      if (this.peerId && Date.now() - this.lastHeard > TIMING.livenessTimeout) {
        this.dropLink(this.peerId);
      }
    });
  }

  // ── Reading ──────────────────────────────────────────────────────────────

  getSnapshot = (): SessionSnapshot => this.store.get();
  subscribe = (listener: () => void): Unsubscribe => this.store.subscribe(listener);

  // ── Commands ─────────────────────────────────────────────────────────────

  roll(): void {
    this.send({ type: MessageType.Roll });
  }

  toggleHold(die: number): void {
    const game = this.store.get().shared.game;
    if (!game) return;
    const held = game.turn.held.map((h, i) => (i === die ? !h : h)) as unknown as Held;
    // Show the change right away; the host's next broadcast confirms or corrects it.
    this.patchShared({ game: { ...game, turn: { ...game.turn, held } } });
    this.send({ type: MessageType.Hold, held });
  }

  score(category: Category, sheet: number): void {
    this.send({ type: MessageType.Score, category, sheet });
  }

  focus(focus: Focus | null): void {
    this.send({ type: MessageType.Focus, focus });
  }

  viewSheet(sheet: number): void {
    this.send({ type: MessageType.ViewSheet, sheet });
  }

  voteRematch(vote: RematchVote): void {
    this.send({ type: MessageType.Vote, vote });
  }

  reconnect(): void {
    if (this.disposed || this.store.get().ended) return;
    void this.reconnectLoop();
  }

  leave(): void {
    if (this.store.get().ended) return;
    this.send({ type: MessageType.Leave });
    const peerId = this.peerId;
    if (peerId) {
      const generation = this.peerGenerations.get(peerId);
      this.cleanupTimers.after(TIMING.closeGrace, () => {
        if (generation !== undefined && isPeerOwner(this.options.transport, peerId, generation)) {
          void this.options.transport.disconnect(peerId);
        }

        if (this.peerId === peerId) this.peerId = null;
      });
    }

    this.peerId = null;
    this.finish(EndReason.Left, peerId);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.reconnecting?.abort();
    this.timers.clearAll();
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    const deferredPeer = this.store.get().ended === EndReason.Left ? this.peerId : null;
    for (const peerId of this.ownedPeers) {
      const generation = this.peerGenerations.get(peerId);
      if (
        peerId !== deferredPeer &&
        generation !== undefined &&
        isPeerOwner(this.options.transport, peerId, generation)
      ) {
        void this.options.transport.disconnect(peerId);
      }
    }

    this.ownedPeers.clear();
    this.peerGenerations.clear();
  }

  // ── Network ──────────────────────────────────────────────────────────────

  private onMessage(message: Message): void {
    this.lastHeard = Date.now();
    switch (message.type) {
      case MessageType.State:
        return this.applyShared(message.shared);
      case MessageType.Kick:
        return this.finish(EndReason.Kicked);
      case MessageType.Close:
        return this.finish(CLOSE_TO_END[message.reason]);
      case MessageType.Ping:
        return this.send({ type: MessageType.Pong, at: message.at });
      default:
        return;
    }
  }

  private onHostLost(): void {
    if (this.store.get().ended || this.reconnecting) return;
    this.peerId = null;
    void this.reconnectLoop();
  }

  private async reconnectLoop(): Promise<void> {
    this.reconnecting?.abort();
    const controller = new AbortController();
    this.reconnecting = controller;
    try {
      for (let attempt = 1; attempt <= MAX_RECONNECT_ATTEMPTS; attempt++) {
        this.setConnection(ConnectionStatus.Reconnecting, attempt);
        await delay(TIMING.reconnectDelays[attempt - 1], controller.signal);
        try {
          const result = await handshake({
            ...this.options,
            code: this.store.get().shared.code,
            rejoinToken: this.rejoinToken,
            timeout: TIMING.reconnectAttemptTimeout,
            signal: controller.signal,
          });
          this.peerId = result.peerId;
          this.ownedPeers.add(result.peerId);
          this.peerGenerations.set(result.peerId, claimPeer(this.options.transport, result.peerId));
          this.lastHeard = Date.now();
          this.applyShared(result.welcome.shared);
          this.setConnection(ConnectionStatus.Connected, 0);

          return;
        } catch (error) {
          if (error instanceof JoinFailedError && error.reason !== JoinError.NotFound) {
            this.finish(EndReason.Kicked);

            return;
          }

          if (error instanceof AbortedError) return;
        }
      }

      this.setConnection(ConnectionStatus.Failed, MAX_RECONNECT_ATTEMPTS);
    } finally {
      if (this.reconnecting === controller) this.reconnecting = null;
    }
  }

  private send(message: Message): void {
    const peerId = this.peerId;
    if (!peerId) return;
    const generation = this.peerGenerations.get(peerId);
    void this.options.transport.send(peerId, encode(message)).catch(() => {
      // Only while the link this went out on is still the current one.
      const current = peerId === this.peerId && this.peerGenerations.get(peerId) === generation;
      if (current) this.dropLink(peerId);
    });
  }

  /** Closes a link that stopped working; reconnecting resyncs from the host's state. */
  private dropLink(peerId: PeerId): void {
    void this.options.transport.disconnect(peerId);
    this.onHostLost();
  }

  // ── State ────────────────────────────────────────────────────────────────

  private applyShared(shared: SharedSession): void {
    const current = this.store.get().shared;
    if (!shared.players.some((player) => player.id === this.store.get().myId)) return;
    if (shared.sessionId === current.sessionId && shared.rev < current.rev) return;
    this.store.update((s) => ({ ...s, shared, clockOffset: Date.now() - shared.hostTime }));
  }

  private patchShared(patch: Partial<SharedSession>): void {
    this.store.update((s) => ({ ...s, shared: { ...s.shared, ...patch } }));
  }

  private setConnection(status: ConnectionStatus, attempt: number): void {
    this.store.update((s) => ({ ...s, connection: { status, attempt } }));
  }

  private finish(ended: EndReason, farewellPeer?: PeerId | null): void {
    if (this.store.get().ended) return;
    this.store.update((s) => ({ ...s, ended }));
    // The Leave frame is already in flight. Preserve its link until the grace
    // timer closes it, while every other terminal path disconnects immediately.
    if (farewellPeer) this.peerId = farewellPeer;
    this.dispose();
  }
}
