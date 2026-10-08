import { generateKeyPairSync } from 'node:crypto';
import forge from 'node-forge';

export interface TestCertificate {
  key: string;
  cert: string;
  ca: string;
}

function keyPair(): { pem: string; keys: forge.pki.rsa.KeyPair } {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  });
  return {
    pem: privateKey,
    keys: {
      privateKey: forge.pki.privateKeyFromPem(privateKey),
      publicKey: forge.pki.publicKeyFromPem(publicKey),
    },
  };
}

function certificate(
  serial: string,
  subject: string,
  publicKey: forge.pki.PublicKey,
  extensions: object[]
): forge.pki.Certificate {
  const cert = forge.pki.createCertificate();
  cert.serialNumber = serial;
  cert.publicKey = publicKey;
  cert.validity.notBefore = new Date(Date.now() - 3_600_000);
  cert.validity.notAfter = new Date(Date.now() + 86_400_000);
  cert.setSubject([{ name: 'commonName', value: subject }]);
  cert.setExtensions(extensions);
  return cert;
}

let cached: TestCertificate | undefined;

export function testCertificate(): TestCertificate {
  if (cached !== undefined) {
    return cached;
  }

  const caKeys = keyPair();
  const ca = certificate('01', 'TronZap SDK Test CA', caKeys.keys.publicKey, [
    { name: 'basicConstraints', cA: true, critical: true },
    { name: 'keyUsage', keyCertSign: true, cRLSign: true, critical: true },
  ]);
  ca.setIssuer(ca.subject.attributes);
  ca.sign(caKeys.keys.privateKey, forge.md.sha256.create());

  const leafKeys = keyPair();
  const leaf = certificate('02', 'localhost', leafKeys.keys.publicKey, [
    { name: 'basicConstraints', cA: false },
    { name: 'keyUsage', digitalSignature: true, keyEncipherment: true, critical: true },
    { name: 'extKeyUsage', serverAuth: true },
    { name: 'subjectAltName', altNames: [{ type: 2, value: 'localhost' }] },
  ]);
  leaf.setIssuer(ca.subject.attributes);
  leaf.sign(caKeys.keys.privateKey, forge.md.sha256.create());

  cached = {
    key: leafKeys.pem,
    cert: forge.pki.certificateToPem(leaf),
    ca: forge.pki.certificateToPem(ca),
  };
  return cached;
}
