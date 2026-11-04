import { BroadcastTransport } from './broadcast/BroadcastTransport';
import type { Transport } from './transport';

let transport: Transport | null = null;

/** The web build's transport: browser tabs play the phones (see `BroadcastTransport`). */
export function getTransport(): Transport {
  transport ??= new BroadcastTransport();

  return transport;
}

/**
 * One more phone in this page, on `channel`; scenarios use one channel per run. Without one it
 * shares the app's channel, so the phone on screen finds its rounds nearby.
 */
export function createBrowserTransport(channel?: string): Transport {
  return new BroadcastTransport(channel);
}
