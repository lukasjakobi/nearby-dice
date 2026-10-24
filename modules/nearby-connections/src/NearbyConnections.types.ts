export type EndpointFoundEvent = { endpointId: string; endpointName: string };
export type EndpointEvent = { endpointId: string };
export type ConnectedEvent = { endpointId: string; authToken: string; incoming: boolean };
export type PayloadEvent = { endpointId: string; data: string };

export type NearbyConnectionsEvents = {
  onEndpointFound: (event: EndpointFoundEvent) => void;
  onEndpointLost: (event: EndpointEvent) => void;
  /** Both sides accepted; `incoming` is true on the advertiser (host). */
  onConnected: (event: ConnectedEvent) => void;
  onDisconnected: (event: EndpointEvent) => void;
  onPayload: (event: PayloadEvent) => void;
};
