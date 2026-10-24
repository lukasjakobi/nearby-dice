/**
 * Transport over Google Nearby Connections via the local native module.
 * Status: written against the documented SDK APIs; not yet verified on devices.
 */
import { PermissionStatus as ExpoPermissionStatus } from 'expo';
import type { PermissionResponse } from 'expo';
import { Platform } from 'react-native';

import NearbyConnections from '@modules/nearby-connections';
import { AbortedError, Emitter, randomId } from '@/lib';
import type { Unsubscribe } from '@/lib';

import { decodeAdvertisement, encodeAdvertisement } from '../advertisement';
import type { Advertisement } from '../advertisement';
import { ConnectFailedError, PermissionStatus, RadioState, TransportEvent } from '../transport';
import type { Connection, EndpointId, PeerId, Transport, TransportEvents } from '../transport';
import { ChunkAssembler, splitIntoChunks } from './chunking';

export const SERVICE_ID = 'io.jakobi.nearbydice.v1';

/** Expo's permission response → our status. Not granted and no second prompt = Blocked. */
export function toPermissionStatus(response: PermissionResponse): PermissionStatus {
  if (response.status === ExpoPermissionStatus.GRANTED) return PermissionStatus.Granted;

  return response.canAskAgain ? PermissionStatus.Denied : PermissionStatus.Blocked;
}

export class MissingNativeModuleError extends Error {
  constructor() {
    super(
      'The NearbyConnections native module is missing. Nearby Dice needs a development build: ' +
        'run `npm run ios` or `npm run android` (Expo Go cannot load it).',
    );
  }
}

export class NearbyTransport implements Transport {
  private emitter = new Emitter<TransportEvents>();
  private assembler = new ChunkAssembler();
  private localName = 'nearbydice';

  constructor() {
    const native = NearbyConnections;
    if (!native) throw new MissingNativeModuleError();
    native.addListener('onEndpointFound', ({ endpointId, endpointName }) => {
      const advertisement = decodeAdvertisement(endpointName);
      if (advertisement)
        this.emitter.emit(TransportEvent.EndpointFound, { endpointId, advertisement });
    });
    native.addListener('onEndpointLost', ({ endpointId }) =>
      this.emitter.emit(TransportEvent.EndpointLost, { endpointId }),
    );
    native.addListener('onConnected', ({ endpointId, authToken, incoming }) => {
      if (incoming)
        this.emitter.emit(TransportEvent.PeerConnected, { peerId: endpointId, authToken });
    });
    native.addListener('onDisconnected', ({ endpointId }) => {
      this.assembler.forget(endpointId);
      this.emitter.emit(TransportEvent.PeerDisconnected, { peerId: endpointId });
    });
    native.addListener('onPayload', ({ endpointId, data }) => {
      const message = this.assembler.accept(endpointId, data);
      if (message !== null)
        this.emitter.emit(TransportEvent.Data, { peerId: endpointId, data: message });
    });
  }

  private get native() {
    return NearbyConnections!;
  }

  async getPermission(): Promise<PermissionStatus> {
    return toPermissionStatus(await this.native.getPermissionsAsync());
  }

  async requestPermission(): Promise<PermissionStatus> {
    return toPermissionStatus(await this.native.requestPermissionsAsync());
  }

  async getRadioState(): Promise<RadioState> {
    if (!(await this.native.isBluetoothEnabled())) return RadioState.BluetoothOff;
    // Keep the Location Services guard while Android scans do not assert neverForLocation.
    if (Platform.OS === 'android' && !(await this.native.isLocationEnabled()))
      return RadioState.LocationOff;

    return RadioState.Ready;
  }

  async startAdvertising(advertisement: Advertisement): Promise<void> {
    this.localName = advertisement.hostName;
    // Nearby cannot change the endpoint name in place; restarting keeps open connections.
    await this.native.stopAdvertising();
    await this.native.startAdvertising(SERVICE_ID, encodeAdvertisement(advertisement));
  }

  stopAdvertising(): Promise<void> {
    return this.native.stopAdvertising();
  }

  startDiscovery(): Promise<void> {
    return this.native.startDiscovery(SERVICE_ID);
  }

  stopDiscovery(): Promise<void> {
    return this.native.stopDiscovery();
  }

  async connect(endpointId: EndpointId, signal?: AbortSignal): Promise<Connection> {
    if (signal?.aborted) throw new AbortedError();
    // Disconnecting cancels the pending request; the native module then rejects it.
    const cancel = () => void this.native.disconnect(endpointId);
    signal?.addEventListener('abort', cancel, { once: true });
    try {
      const { authToken } = await this.native.requestConnection(endpointId, this.localName);
      if (signal?.aborted) throw new AbortedError();

      return { peerId: endpointId, authToken };
    } catch {
      throw signal?.aborted ? new AbortedError() : new ConnectFailedError(endpointId);
    } finally {
      signal?.removeEventListener('abort', cancel);
    }
  }

  async send(peerId: PeerId, data: string): Promise<void> {
    for (const chunk of splitIntoChunks(data, randomId(6))) {
      await this.native.sendPayload(peerId, chunk);
    }
  }

  disconnect(peerId?: PeerId): Promise<void> {
    return peerId ? this.native.disconnect(peerId) : this.native.stopAllEndpoints();
  }

  on<E extends TransportEvent>(
    event: E,
    listener: (payload: TransportEvents[E]) => void,
  ): Unsubscribe {
    return this.emitter.on(event, listener);
  }
}
