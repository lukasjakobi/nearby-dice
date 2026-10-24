import CoreBluetooth
import Foundation
import Network

/// Bluetooth and Local Network permission, reported in Expo's permission shape
/// ({ status, granted, canAskAgain, expires }) like every other Expo permission.
final class NearbyPermissions: NSObject, CBCentralManagerDelegate {
  /// First 12 hex chars of SHA-256("io.jakobi.nearbydice.v1"); must also be in NSBonjourServices.
  static let bonjourType = "_2915FFD77C93._tcp"
  private static let localNetworkRequestedKey = "nearbydice.nearby.localNetworkRequested"
  /// Read only as a legacy request marker. Its Boolean value is never permission truth.
  private static let legacyLocalNetworkKey = "nearbydice.nearby.localNetworkGranted"
  /// How long to wait for the operating system's Local Network probe to produce evidence.
  private static let probeTimeout: TimeInterval = 30

  private var central: CBCentralManager?
  private var bluetoothWaiters: [() -> Void] = []
  private var probe: LocalNetworkProbe?
  private var localNetworkWaiters: [(LocalNetworkProbe.Result) -> Void] = []

  // MARK: Reading

  /// Before the first explicit request, read without prompting. Afterwards, probe
  /// again so a trip to Settings is visible without reinstalling.
  func current(_ completion: @escaping ([String: Any]) -> Void) {
    DispatchQueue.main.async { self.readCurrent(completion) }
  }

  private func readCurrent(
    _ completion: @escaping ([String: Any]) -> Void,
    allowImmediateDenial: Bool = true
  ) {
    let bluetooth = CBManager.authorization
    guard bluetooth == .allowedAlways else {
      let denied = bluetooth == .denied || bluetooth == .restricted
      completion([
        "status": denied ? "denied" : "undetermined",
        "granted": false,
        "canAskAgain": !denied,
        "expires": "never",
      ])
      return
    }

    let defaults = UserDefaults.standard
    let hasRequested = defaults.bool(forKey: Self.localNetworkRequestedKey) ||
      defaults.object(forKey: Self.legacyLocalNetworkKey) != nil
    guard hasRequested else {
      completion(["status": "undetermined", "granted": false, "canAskAgain": true, "expires": "never"])
      return
    }

    probeLocalNetwork(allowImmediateDenial: allowImmediateDenial) { localNetwork in
      let currentBluetooth = CBManager.authorization
      let bluetoothDenied = currentBluetooth == .denied || currentBluetooth == .restricted
      let granted = currentBluetooth == .allowedAlways && localNetwork == .granted
      let denied = bluetoothDenied || localNetwork == .denied
      let status = granted ? "granted" : denied ? "denied" : "undetermined"
      let canAskAgain = currentBluetooth == .notDetermined || (!denied && localNetwork == .unknown)
      completion(["status": status, "granted": granted, "canAskAgain": canAskAgain, "expires": "never"])
    }
  }

  // MARK: Requesting

  /// Shows the Bluetooth prompt, then the Local Network prompt, then reports the result.
  func request(_ completion: @escaping ([String: Any]) -> Void) {
    DispatchQueue.main.async {
      self.requestBluetooth {
        guard CBManager.authorization == .allowedAlways else {
          self.readCurrent(completion)
          return
        }
        // This records that probing is expected. Only the operational probe can
        // report a grant or denial; the marker itself never supplies that result.
        let defaults = UserDefaults.standard
        let requestedBefore = defaults.bool(forKey: Self.localNetworkRequestedKey) ||
          defaults.object(forKey: Self.legacyLocalNetworkKey) != nil
        defaults.set(true, forKey: Self.localNetworkRequestedKey)
        self.readCurrent(completion, allowImmediateDenial: requestedBefore)
      }
    }
  }

  private func requestBluetooth(_ done: @escaping () -> Void) {
    guard CBManager.authorization == .notDetermined else { return done() }
    bluetoothWaiters.append(done)
    if central == nil {
      // Creating a manager shows the system prompt on first use.
      central = CBCentralManager(delegate: self, queue: nil, options: [CBCentralManagerOptionShowPowerAlertKey: false])
    }
  }

  func centralManagerDidUpdateState(_ central: CBCentralManager) {
    guard CBManager.authorization != .notDetermined else { return }
    bluetoothWaiters.forEach { $0() }
    bluetoothWaiters.removeAll()
  }

  private func probeLocalNetwork(
    allowImmediateDenial: Bool,
    _ done: @escaping (LocalNetworkProbe.Result) -> Void
  ) {
    localNetworkWaiters.append(done)
    guard probe == nil else { return }
    let probe = LocalNetworkProbe(
      type: Self.bonjourType,
      timeout: Self.probeTimeout,
      allowImmediateDenial: allowImmediateDenial
    ) { [weak self] result in
      guard let self else { return }
      self.probe = nil
      let waiters = self.localNetworkWaiters
      self.localNetworkWaiters.removeAll()
      waiters.forEach { $0(result) }
    }
    self.probe = probe
    probe.start()
  }

  // MARK: Bluetooth power

  /// Whether Bluetooth is switched on (needs a manager instance to read).
  func bluetoothPoweredOn(_ completion: @escaping (Bool) -> Void) {
    if let central, central.state != .unknown, central.state != .resetting {
      return completion(central.state == .poweredOn)
    }
    bluetoothWaiters.append { [weak self] in completion(self?.central?.state == .poweredOn) }
    if central == nil {
      central = CBCentralManager(delegate: self, queue: nil, options: [CBCentralManagerOptionShowPowerAlertKey: false])
    }
  }
}

/// iOS has no API to ask for Local Network access. Publishing a Bonjour service and
/// browsing for it shows the prompt; finding our own service means access was granted.
private final class LocalNetworkProbe {
  enum Result {
    case granted
    case denied
    case unknown
  }

  private let type: String
  private let timeout: TimeInterval
  private let allowImmediateDenial: Bool
  private let completion: (Result) -> Void
  private let name = "nearbydice-probe-\(UUID().uuidString.prefix(8))"
  private var listener: NWListener?
  private var browser: NWBrowser?
  private var finished = false

  init(type: String, timeout: TimeInterval, allowImmediateDenial: Bool, completion: @escaping (Result) -> Void) {
    self.type = type
    self.timeout = timeout
    self.allowImmediateDenial = allowImmediateDenial
    self.completion = completion
  }

  func start() {
    do {
      let listener = try NWListener(using: .tcp)
      listener.service = NWListener.Service(name: name, type: type)
      listener.newConnectionHandler = { $0.cancel() }
      listener.stateUpdateHandler = { _ in }
      listener.start(queue: .main)
      self.listener = listener
    } catch {
      return finish(.unknown)
    }

    let browser = NWBrowser(for: .bonjour(type: type, domain: nil), using: .tcp)
    browser.browseResultsChangedHandler = { [weak self] results, _ in
      guard let self else { return }
      let foundSelf = results.contains { result in
        if case let .service(name, _, _, _) = result.endpoint { return name == self.name }
        return false
      }
      if foundSelf { self.finish(.granted) }
    }
    browser.stateUpdateHandler = { [weak self] state in
      guard let self else { return }
      switch state {
      case .waiting(let error), .failed(let error):
        // TN3179: Bonjour denial is commonly .waiting(.dns(PolicyDenied)).
        // https://developer.apple.com/documentation/technotes/tn3179-understanding-local-network-privacy
        if Self.isPolicyDenied(error) {
          // The first alert may report PolicyDenied before the person answers.
          // Keep waiting for success; an unanswered probe remains unknown.
          if self.allowImmediateDenial { self.finish(.denied) }
        } else if case .failed = state {
          self.finish(.unknown)
        }
      default:
        break
      }
    }
    browser.start(queue: .main)
    self.browser = browser

    // A timeout is inconclusive: the prompt may still be unanswered, or no
    // local Bonjour result may have appeared yet. Never cache it as a refusal.
    DispatchQueue.main.asyncAfter(deadline: .now() + timeout) { [weak self] in self?.finish(.unknown) }
  }

  private static func isPolicyDenied(_ error: NWError) -> Bool {
    switch error {
    case .dns(let code): return code == -65570 // kDNSServiceErr_PolicyDenied
    case .posix(.EACCES): return true
    default: return false
    }
  }

  private func finish(_ result: Result) {
    guard !finished else { return }
    finished = true
    browser?.cancel()
    listener?.cancel()
    completion(result)
  }
}
