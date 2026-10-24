/**
 * The radio layer. Moves opaque strings between nearby phones in a star topology:
 * one host, guests connect only to the host. It knows nothing about the game;
 * the session layer gives the strings meaning.
 */
import type { Unsubscribe } from '@/lib';

import type { Advertisement } from './advertisement';

/** Identifies a host found during discovery. */
export type EndpointId = string;
/** Identifies an open connection. */
export type PeerId = string;

export enum PermissionStatus {
  Granted = 'granted',
  Denied = 'denied',
  /** Permanently denied: only the OS settings can change it. */
  Blocked = 'blocked',
  Unavailable = 'unavailable',
}

export enum RadioState {
  Ready = 'ready',
  BluetoothOff = 'bluetooth-off',
  LocationOff = 'location-off',
}

export enum TransportEvent {
  EndpointFound = 'endpoint-found',
  EndpointLost = 'endpoint-lost',
  /** Host side: a guest connected. */
  PeerConnected = 'peer-connected',
  PeerDisconnected = 'peer-disconnected',
  Data = 'data',
}

export type TransportEvents = {
  [TransportEvent.EndpointFound]: { endpointId: EndpointId; advertisement: Advertisement };
  [TransportEvent.EndpointLost]: { endpointId: EndpointId };
  [TransportEvent.PeerConnected]: { peerId: PeerId; authToken: string };
  [TransportEvent.PeerDisconnected]: { peerId: PeerId };
  [TransportEvent.Data]: { peerId: PeerId; data: string };
};

export type Connection = { peerId: PeerId; authToken: string };

export interface Transport {
  getPermission(): Promise<PermissionStatus>;
  requestPermission(): Promise<PermissionStatus>;
  getRadioState(): Promise<RadioState>;

  /** Starts advertising, or updates the advertisement while already advertising. */
  startAdvertising(advertisement: Advertisement): Promise<void>;
  stopAdvertising(): Promise<void>;

  startDiscovery(): Promise<void>;
  stopDiscovery(): Promise<void>;

  /**
   * Guest side: connects to a discovered host. Rejects when the host cannot be reached, and with
   * `AbortedError` when `signal` fires first; a cancelled request leaves no connection behind.
   */
  connect(endpointId: EndpointId, signal?: AbortSignal): Promise<Connection>;
  /**
   * Any size; implementations split large payloads if the radio needs it. Resolves once the radio
   * has accepted the data, which is no proof of delivery; rejects when the link is unusable.
   */
  send(peerId: PeerId, data: string): Promise<void>;
  /** Closes one connection, or all of them. */
  disconnect(peerId?: PeerId): Promise<void>;

  on<E extends TransportEvent>(
    event: E,
    listener: (payload: TransportEvents[E]) => void,
  ): Unsubscribe;
}

export class ConnectFailedError extends Error {
  constructor(readonly endpointId: EndpointId) {
    super(`Could not connect to ${endpointId}`);
  }
}
