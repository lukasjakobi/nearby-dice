import ExpoModulesCore
import NearbyConnections

/// Thin bridge over Google Nearby Connections (star strategy). Connections are accepted
/// on both sides automatically; the JS session layer compares the auth token itself.
/// Status: written against the documented Swift API; not yet verified on devices.
public class NearbyConnectionsModule: Module {
  private var manager: ConnectionManager?
  private var advertiser: Advertiser?
  private var discoverer: Discoverer?
  private var serviceId = ""
  private lazy var bridge = NearbyBridge(module: self)
  private let permissions = NearbyPermissions()

  /// Outgoing connection requests waiting for both sides to accept.
  fileprivate var pendingConnections: [String: Promise] = [:]
  fileprivate var authTokens: [String: String] = [:]
  fileprivate var incoming: Set<String> = []

  public func definition() -> ModuleDefinition {
    Name("NearbyConnections")

    Events("onEndpointFound", "onEndpointLost", "onConnected", "onDisconnected", "onPayload")

    AsyncFunction("startAdvertising") { (serviceId: String, endpointName: String) in
      let manager = self.connectionManager(for: serviceId)
      self.advertiser?.stopAdvertising()
      let advertiser = Advertiser(connectionManager: manager)
      advertiser.delegate = self.bridge
      advertiser.startAdvertising(using: Data(endpointName.utf8))
      self.advertiser = advertiser
    }

    AsyncFunction("stopAdvertising") {
      self.advertiser?.stopAdvertising()
      self.advertiser = nil
    }

    AsyncFunction("startDiscovery") { (serviceId: String) in
      let manager = self.connectionManager(for: serviceId)
      if self.discoverer != nil { return }
      let discoverer = Discoverer(connectionManager: manager)
      discoverer.delegate = self.bridge
      discoverer.startDiscovery()
      self.discoverer = discoverer
    }

    AsyncFunction("stopDiscovery") {
      self.discoverer?.stopDiscovery()
      self.discoverer = nil
    }

    AsyncFunction("requestConnection") { (endpointId: String, localName: String, promise: Promise) in
      guard let discoverer = self.discoverer else {
        promise.reject("NOT_DISCOVERING", "Start discovery before connecting")
        return
      }
      self.pendingConnections[endpointId] = promise
      discoverer.requestConnection(to: endpointId, using: Data(localName.utf8)) { error in
        if let error {
          self.pendingConnections.removeValue(forKey: endpointId)?
            .reject("CONNECTION_FAILED", error.localizedDescription)
        }
      }
    }

    // Settles once the SDK has accepted or refused the payload, like Android's sendPayload task.
    AsyncFunction("sendPayload") { (endpointId: String, data: String, promise: Promise) in
      guard let manager = self.manager else {
        promise.reject("SEND_FAILED", "Not connected")
        return
      }
      _ = manager.send(Data(data.utf8), to: [endpointId]) { error in
        if let error {
          promise.reject("SEND_FAILED", error.localizedDescription)
        } else {
          promise.resolve()
        }
      }
    }

    AsyncFunction("disconnect") { (endpointId: String) in
      self.manager?.disconnect(from: endpointId)
      self.forget(endpointId)
    }

    AsyncFunction("stopAllEndpoints") {
      // Pending requests are included, so their promises are rejected instead of left unsettled.
      for endpointId in Set(self.authTokens.keys).union(self.pendingConnections.keys) {
        self.manager?.disconnect(from: endpointId)
        self.forget(endpointId)
      }
    }

    AsyncFunction("isBluetoothEnabled") { (promise: Promise) in
      self.permissions.bluetoothPoweredOn { promise.resolve($0) }
    }

    // Bluetooth + Local Network, in Expo's permission response shape.
    AsyncFunction("getPermissionsAsync") { (promise: Promise) in
      self.permissions.current { promise.resolve($0) }
    }

    AsyncFunction("requestPermissionsAsync") { (promise: Promise) in
      self.permissions.request { promise.resolve($0) }
    }

    OnDestroy {
      self.advertiser?.stopAdvertising()
      self.discoverer?.stopDiscovery()
    }
  }

  private func connectionManager(for serviceId: String) -> ConnectionManager {
    if let manager, self.serviceId == serviceId { return manager }
    let manager = ConnectionManager(serviceID: serviceId, strategy: .star)
    manager.delegate = bridge
    self.manager = manager
    self.serviceId = serviceId
    return manager
  }

  fileprivate func forget(_ endpointId: String) {
    authTokens.removeValue(forKey: endpointId)
    incoming.remove(endpointId)
    pendingConnections.removeValue(forKey: endpointId)?.reject("DISCONNECTED", "Disconnected")
  }

  fileprivate func emit(_ name: String, _ body: [String: Any]) {
    sendEvent(name, body)
  }
}

/// Receives the SDK's delegate callbacks and forwards them to JS.
private final class NearbyBridge: AdvertiserDelegate, DiscovererDelegate, ConnectionManagerDelegate {
  private weak var module: NearbyConnectionsModule?

  init(module: NearbyConnectionsModule) {
    self.module = module
  }

  // MARK: AdvertiserDelegate

  func advertiser(
    _ advertiser: Advertiser,
    didReceiveConnectionRequestFrom endpointID: EndpointID,
    with context: Data,
    connectionRequestHandler: @escaping (Bool) -> Void
  ) {
    module?.incoming.insert(endpointID)
    connectionRequestHandler(true)
  }

  // MARK: DiscovererDelegate

  func discoverer(_ discoverer: Discoverer, didFind endpointID: EndpointID, with context: Data) {
    let name = String(data: context, encoding: .utf8) ?? ""
    module?.emit("onEndpointFound", ["endpointId": endpointID, "endpointName": name])
  }

  func discoverer(_ discoverer: Discoverer, didLose endpointID: EndpointID) {
    module?.emit("onEndpointLost", ["endpointId": endpointID])
  }

  // MARK: ConnectionManagerDelegate

  func connectionManager(
    _ connectionManager: ConnectionManager,
    didReceive verificationCode: String,
    from endpointID: EndpointID,
    verificationHandler: @escaping (Bool) -> Void
  ) {
    module?.authTokens[endpointID] = verificationCode
    verificationHandler(true)
  }

  func connectionManager(
    _ connectionManager: ConnectionManager,
    didReceive data: Data,
    withID payloadID: PayloadID,
    from endpointID: EndpointID
  ) {
    let text = String(data: data, encoding: .utf8) ?? ""
    module?.emit("onPayload", ["endpointId": endpointID, "data": text])
  }

  func connectionManager(
    _ connectionManager: ConnectionManager,
    didReceive stream: InputStream,
    withID payloadID: PayloadID,
    from endpointID: EndpointID,
    cancellationToken token: CancellationToken
  ) {}

  func connectionManager(
    _ connectionManager: ConnectionManager,
    didStartReceivingResourceWithID payloadID: PayloadID,
    from endpointID: EndpointID,
    at localURL: URL,
    withName name: String,
    cancellationToken token: CancellationToken
  ) {}

  func connectionManager(
    _ connectionManager: ConnectionManager,
    didReceiveTransferUpdate update: TransferUpdate,
    from endpointID: EndpointID,
    forPayload payloadID: PayloadID
  ) {}

  func connectionManager(
    _ connectionManager: ConnectionManager,
    didChangeTo state: ConnectionState,
    for endpointID: EndpointID
  ) {
    guard let module else { return }
    switch state {
    case .connected:
      let token = module.authTokens[endpointID] ?? ""
      module.pendingConnections.removeValue(forKey: endpointID)?.resolve(["authToken": token])
      module.emit(
        "onConnected",
        ["endpointId": endpointID, "authToken": token, "incoming": module.incoming.contains(endpointID)]
      )
    case .disconnected, .rejected:
      module.forget(endpointID)
      module.emit("onDisconnected", ["endpointId": endpointID])
    case .connecting:
      break
    @unknown default:
      break
    }
  }
}
