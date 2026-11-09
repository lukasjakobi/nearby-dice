/**
 * Who may sit at the host's table: seats with their rejoin tokens, bans, and the
 * answer to each HELLO. The rules are in docs/technical-design.md, "Admission".
 */
import { Link } from '@/domain';
import type { PlayerId } from '@/domain';
import { randomId, secureRandomId } from '@/lib';
import type { PeerId } from '@/net';

import { RejectReason } from './protocol';
import type { MessageOf, MessageType } from './protocol';
import { SessionPhase } from './types';
import type { PlayerInfo, SharedSession } from './types';

type Seat = { rejoinToken: string; deviceId: string; peerId: PeerId | null };

export enum AdmissionKind {
  Reject = 'reject',
  /** A known player is back with their rejoin token. */
  Return = 'return',
  /** A new player takes a free lobby seat. */
  Join = 'join',
}

export type Admission =
  | { kind: AdmissionKind.Reject; reason: RejectReason }
  | { kind: AdmissionKind.Return; playerId: PlayerId }
  | { kind: AdmissionKind.Join; playerId: PlayerId; players: PlayerInfo[] };

export class Seats {
  private readonly seats = new Map<PlayerId, Seat>();
  private readonly bannedDevices = new Set<string>();

  /** Answers a HELLO. A new player gets a seat here; the caller adds them to `players`. */
  admit(hello: MessageOf<MessageType.Hello>, shared: SharedSession): Admission {
    const { phase, players, maxPlayers, allowRejoin } = shared;
    const reject = (reason: RejectReason): Admission => ({ kind: AdmissionKind.Reject, reason });
    if (this.bannedDevices.has(hello.deviceId)) return reject(RejectReason.Removed);

    // Only the session's rejoin token returns a seat; a device ID alone never does.
    const returning = [...this.seats].find(
      ([, seat]) => seat.rejoinToken === hello.rejoinToken && seat.deviceId === hello.deviceId,
    );
    if (returning) {
      const [playerId] = returning;
      const player = players.find((p) => p.id === playerId);
      if (!player || player.link === Link.Removed) return reject(RejectReason.Removed);
      if (phase !== SessionPhase.Lobby && !allowRejoin) return reject(RejectReason.Removed);

      return { kind: AdmissionKind.Return, playerId };
    }

    if (phase !== SessionPhase.Lobby) return reject(RejectReason.Started);
    // A device that lost its lobby link without its token (e.g. after an app restart)
    // joins anew, and its orphaned seat makes room.
    const orphan = [...this.seats].find(
      ([, seat]) => seat.deviceId === hello.deviceId && !seat.peerId,
    )?.[0];
    const others = players.filter((p) => p.id !== orphan);
    if (others.length >= maxPlayers) return reject(RejectReason.Full);
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

    return { kind: AdmissionKind.Join, playerId: player.id, players: [...others, player] };
  }

  /** Links an admitted seat to `peerId`; returns its rejoin token and the link it replaces. */
  bind(playerId: PlayerId, peerId: PeerId): { rejoinToken: string; replaced: PeerId | null } {
    const seat = this.seats.get(playerId)!;
    const replaced = seat.peerId && seat.peerId !== peerId ? seat.peerId : null;
    seat.peerId = peerId;

    return { rejoinToken: seat.rejoinToken, replaced };
  }

  /** Clears a seat's link and returns it. With `peerId`, only while it is still that link. */
  unbind(playerId: PlayerId, peerId?: PeerId): PeerId | null {
    const seat = this.seats.get(playerId);
    const current = seat?.peerId ?? null;
    if (!seat || !current || (peerId && current !== peerId)) return null;
    seat.peerId = null;

    return current;
  }

  /** Frees a seat, optionally banning its device; returns the link it still had. */
  remove(playerId: PlayerId, { ban = false } = {}): PeerId | null {
    const seat = this.seats.get(playerId);
    if (!seat) return null;
    if (ban) this.bannedDevices.add(seat.deviceId);
    this.seats.delete(playerId);

    return seat.peerId;
  }

  playerIds(): PlayerId[] {
    return [...this.seats.keys()];
  }

  peerIds(): PeerId[] {
    return [...this.seats.values()].flatMap((seat) => (seat.peerId ? [seat.peerId] : []));
  }

  clear(): void {
    this.seats.clear();
  }
}
