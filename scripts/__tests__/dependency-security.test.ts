import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

// Run the installed packages in Node, outside Jest's transforms and Expo mocks. A timeout also
// bounds a regression to the decoder's CPU exhaustion vulnerability.
function runNode(source: string) {
  execFileSync(process.execPath, ['--input-type=commonjs', '--eval', source], {
    cwd: resolve(__dirname, '../..'),
    timeout: 10_000,
    stdio: 'pipe',
  });
}

describe('installed dependency security fixes', () => {
  it('decodes query parameters through the CommonJS consumer, including large malformed input', () => {
    runNode(`
      const assert = require('node:assert/strict');
      const queryString = require('query-string');
      const params = queryString.parse('name=M%C3%BCller&raw=%FF%41&repeat=a&repeat=b');
      assert.equal(params.name, 'Müller');
      assert.equal(params.raw, '%FFA');
      assert.deepEqual(params.repeat, ['a', 'b']);
      assert.equal(queryString.stringify({ name: 'Müller' }), 'name=M%C3%BCller');
      const malformed = '%EA'.repeat(20_000) + '%41';
      assert.equal(queryString.parse('value=' + malformed).value, '%EA'.repeat(20_000) + 'A');
    `);
  });

  it('rejects an oversized Zod collection before allocating per-element validation errors', () => {
    runNode(`
      const assert = require('node:assert/strict');
      const { z } = require('zod');
      const result = z.array(z.string()).max(2).safeParse(new Array(20_000).fill(42));
      assert.equal(result.success, false);
      assert.equal(result.error.issues.length, 1);
      assert.equal(result.error.issues[0].code, 'too_big');
    `);
  });

  it('keeps Expo CLI plugin validation and command schemas compatible with Zod 4', () => {
    runNode(`
      const assert = require('node:assert/strict');
      const { createRequire } = require('node:module');
      const expoRequire = createRequire(require.resolve('expo/package.json'));
      const cliRequire = createRequire(expoRequire.resolve('@expo/cli/package.json'));
      const { PluginSchema } = cliRequire('./build/src/start/server/DevToolsPlugin.schema.js');
      const { createMCPDevToolsExtensionSchema } = cliRequire(
        './build/src/start/server/createMCPDevToolsExtensionSchema.js'
      );
      const commands = [{
        name: 'ping', title: 'Ping', environments: ['cli', 'mcp'],
        parameters: [{ name: 'count', type: 'number' }],
      }];
      const plugin = {
        packageName: 'example', packageRoot: '/example',
        cliExtensions: { description: 'Example', entryPoint: 'index.js', commands },
      };
      assert.deepEqual(PluginSchema.parse(plugin), plugin);
      assert.equal(PluginSchema.safeParse({ ...plugin, packageName: '' }).success, false);
      const schema = createMCPDevToolsExtensionSchema(plugin);
      assert.deepEqual(schema.parse({ command: 'ping', count: 2 }), { command: 'ping', count: 2 });
      assert.equal(schema.safeParse({ command: 'unknown' }).success, false);
      assert.equal(schema.safeParse({ command: 'ping', extra: true }).success, false);
    `);
  });

  it('rejects nested RSA DigestAlgorithm garbage while accepting valid signatures', () => {
    runNode(`
      const assert = require('node:assert/strict');
      const { generateKeyPairSync } = require('node:crypto');
      const forge = require('node-forge');
      const pair = generateKeyPairSync('rsa', {
        modulusLength: 1024,
        privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
        publicKeyEncoding: { type: 'spki', format: 'pem' },
      });
      const privateKey = forge.pki.privateKeyFromPem(pair.privateKey);
      const publicKey = forge.pki.publicKeyFromPem(pair.publicKey);
      const md = forge.md.sha256.create().update('dependency security regression');
      const digest = md.digest().getBytes();
      assert.equal(publicKey.verify(digest, privateKey.sign(md)), true);
      const { asn1 } = forge;
      const element = (type, constructed, value) =>
        asn1.create(asn1.Class.UNIVERSAL, type, constructed, value);
      const oid = element(asn1.Type.OID, false, asn1.oidToDer(forge.oids.sha256).getBytes());
      const nullParameter = element(asn1.Type.NULL, false, '');
      const garbage = element(asn1.Type.OCTETSTRING, false, 'unconsumed');
      for (const parameters of [[], [nullParameter]]) {
        for (const extra of [[], [garbage]]) {
          const info = element(asn1.Type.SEQUENCE, true, [
            element(asn1.Type.SEQUENCE, true, [oid, ...parameters, ...extra]),
            element(asn1.Type.OCTETSTRING, false, digest),
          ]);
          const signature = privateKey.sign(asn1.toDer(info).getBytes(), 'NONE');
          if (extra.length) {
            assert.throws(() => publicKey.verify(digest, signature), /DigestInfo/);
          } else {
            assert.equal(publicKey.verify(digest, signature), true);
          }
        }
      }
    `);
  });

  it('keeps Expo certificate generation, validation and signing working with the RSA backport', () => {
    runNode(`
      const assert = require('node:assert/strict');
      const { generateKeyPairSync } = require('node:crypto');
      const certificates = require('@expo/code-signing-certificates');
      const pair = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
        publicKeyEncoding: { type: 'spki', format: 'pem' },
      });
      const keyPair = certificates.convertKeyPairPEMToKeyPair({
        privateKeyPEM: pair.privateKey, publicKeyPEM: pair.publicKey,
      });
      const certificate = certificates.generateSelfSignedCodeSigningCertificate({
        keyPair, commonName: 'Dependency security test',
        validityNotBefore: new Date(Date.now() - 60_000),
        validityNotAfter: new Date(Date.now() + 60_000),
      });
      certificates.validateSelfSignedCertificate(certificate, keyPair);
      const signature = certificates.signBufferRSASHA256AndVerify(
        keyPair.privateKey, certificate, Buffer.from('test bundle')
      );
      assert.ok(signature.length > 0);
    `);
  });
});
