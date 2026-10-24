import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const permissionsSource = readFileSync(join(__dirname, '..', 'NearbyPermissions.swift'), 'utf8');
const moduleSource = readFileSync(join(__dirname, '..', 'NearbyConnectionsModule.swift'), 'utf8');

describe('iOS Local Network permission source contract', () => {
  test('permission reads probe only after an explicit request, without trusting saved results', () => {
    expect(permissionsSource).toContain('func current(_ completion: @escaping ([String: Any]) -> Void)');
    expect(permissionsSource).toContain('probeLocalNetwork(allowImmediateDenial: allowImmediateDenial) { localNetwork in');
    expect(permissionsSource).toContain('guard hasRequested else {');
    expect(permissionsSource).toContain('defaults.object(forKey: Self.legacyLocalNetworkKey) != nil');
    expect(permissionsSource).toContain('defaults.set(true, forKey: Self.localNetworkRequestedKey)');
    expect(permissionsSource).not.toContain('UserDefaults.standard.set(granted');
    expect(permissionsSource).not.toContain('as? Bool');
    expect(permissionsSource.indexOf('guard bluetooth == .allowedAlways else')).toBeLessThan(
      permissionsSource.indexOf('probeLocalNetwork(allowImmediateDenial: allowImmediateDenial) { localNetwork in'),
    );
    expect(permissionsSource.indexOf('guard hasRequested else {')).toBeLessThan(
      permissionsSource.indexOf('probeLocalNetwork(allowImmediateDenial: allowImmediateDenial) { localNetwork in'),
    );
  });

  test('Bonjour policy denial handles waiting and failed states without rejecting the first pending prompt', () => {
    expect(permissionsSource).toContain('case .waiting(let error), .failed(let error):');
    expect(permissionsSource).toContain('case .dns(let code): return code == -65570');
    expect(permissionsSource).toContain('case .posix(.EACCES): return true');
    expect(permissionsSource).toContain('allowImmediateDenial: requestedBefore');
    expect(permissionsSource).toContain('if self.allowImmediateDenial { self.finish(.denied) }');
    expect(permissionsSource).toContain('self?.finish(.unknown)');
  });

  test('concurrent permission reads share one probe and an inconclusive timeout stays unknown', () => {
    expect(permissionsSource).toContain('guard probe == nil else { return }');
    expect(permissionsSource).toContain('finish(.unknown)');
    expect(permissionsSource).toContain('waiters.forEach { $0(result) }');
  });

  test('the Expo permission read waits for the asynchronous native probe', () => {
    expect(moduleSource).toContain('AsyncFunction("getPermissionsAsync") { (promise: Promise) in');
    expect(moduleSource).toContain('self.permissions.current { promise.resolve($0) }');
  });
});
