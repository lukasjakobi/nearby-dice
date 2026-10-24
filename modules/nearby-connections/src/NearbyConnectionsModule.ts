import { NativeModule, requireOptionalNativeModule } from 'expo';
import type { PermissionResponse } from 'expo';

import type { NearbyConnectionsEvents } from './NearbyConnections.types';

/**
 * Thin bridge over Google Nearby Connections (P2P_STAR). Connections are accepted
 * automatically on both sides; the session layer verifies the auth token itself.
 */
declare class NearbyConnectionsModule extends NativeModule<NearbyConnectionsEvents> {
  /**
   * Everything Nearby needs, the platform way:
   * Android runtime permissions for the running SDK level (Bluetooth, nearby Wi-Fi, location
   * through API 31 for discovery, local network on 17+); iOS Bluetooth and Local Network.
   */
  getPermissionsAsync(): Promise<PermissionResponse>;
  /** Shows the system prompts that are still possible. */
  requestPermissionsAsync(): Promise<PermissionResponse>;
  isBluetoothEnabled(): Promise<boolean>;
  /** Android only: whether system Location Services are switched on. */
  isLocationEnabled(): Promise<boolean>;

  startAdvertising(serviceId: string, endpointName: string): Promise<void>;
  stopAdvertising(): Promise<void>;
  startDiscovery(serviceId: string): Promise<void>;
  stopDiscovery(): Promise<void>;
  /** Resolves once both sides accepted, with the token both sides see. */
  requestConnection(endpointId: string, localName: string): Promise<{ authToken: string }>;
  sendPayload(endpointId: string, data: string): Promise<void>;
  disconnect(endpointId: string): Promise<void>;
  stopAllEndpoints(): Promise<void>;
}

/** `null` without the native module (Expo Go, tests). */
export default requireOptionalNativeModule<NearbyConnectionsModule>('NearbyConnections');
