import { Emitter, randomId } from '@/lib';
import type { Unsubscribe } from '@/lib';

import type { Advertisement } from '../advertisement';
import { PermissionStatus, RadioState } from '../transport';
import type {
  Connection,
  EndpointId,
  PeerId,
  Transport,
  TransportEvent,
  TransportEvents,
} from '../transport';
import type { FakeNetwork } from './FakeNetwork';

/** One phone on a FakeNetwork (tests). */
export class FakeTransport implements Transport {
  readonly id = randomId(8);
  /** Tests flip these to exercise permission and Bluetooth/Location Services error paths. */
  permission = PermissionStatus.Granted;
  radio = RadioState.Ready;
  private emitter = new Emitter<TransportEvents>();

  constructor(
    readonly network: FakeNetwork,
    readonly label = 'device',
  ) {
    network.register(this);
  }

  async getPermission(): Promise<PermissionStatus> {
    return this.permission;
  }

  async requestPermission(): Promise<PermissionStatus> {
    return this.permission;
  }

  async getRadioState(): Promise<RadioState> {
    return this.radio;
  }

  async startAdvertising(advertisement: Advertisement): Promise<void> {
    this.network.setAdvertisement(this, advertisement);
  }

  async stopAdvertising(): Promise<void> {
    this.network.setAdvertisement(this, null);
  }

  async startDiscovery(): Promise<void> {
    this.network.setDiscovering(this, true);
  }

  async stopDiscovery(): Promise<void> {
    this.network.setDiscovering(this, false);
  }

  connect(endpointId: EndpointId, signal?: AbortSignal): Promise<Connection> {
    return this.network.connect(this, endpointId, signal);
  }

  async send(peerId: PeerId, data: string): Promise<void> {
    this.network.send(this, peerId, data);
  }

  async disconnect(peerId?: PeerId): Promise<void> {
    this.network.disconnect(this, peerId);
  }

  on<E extends TransportEvent>(
    event: E,
    listener: (payload: TransportEvents[E]) => void,
  ): Unsubscribe {
    return this.emitter.on(event, listener);
  }

  /** Called by the network to deliver an event to this phone. */
  receive<E extends TransportEvent>(event: E, payload: TransportEvents[E]): void {
    this.emitter.emit(event, payload);
  }
}
