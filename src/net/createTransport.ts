import { NearbyTransport } from './nearby/NearbyTransport';
import type { Transport } from './transport';

let transport: Transport | null = null;

/**
 * The app's one transport (Google Nearby Connections). Host and guest sessions share it;
 * only one session runs at a time. Throws without the native module (e.g. in Expo Go):
 * the app needs a development build. The web build has its own (`createTransport.web.ts`).
 */
export function getTransport(): Transport {
  transport ??= new NearbyTransport();

  return transport;
}

/** Scenarios play several phones in one page, which only the web build can. */
export function createBrowserTransport(channel: string): Transport {
  throw new Error(`Browser transports (${channel}) exist in the web build only.`);
}
