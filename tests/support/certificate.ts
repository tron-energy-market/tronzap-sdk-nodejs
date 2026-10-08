import { webcrypto } from 'node:crypto';
import 'reflect-metadata';
import * as x509 from '@peculiar/x509';

export interface TestCertificate {
  key: string;
  cert: string;
  ca: string;
}

const algorithm = {
  name: 'RSASSA-PKCS1-v1_5',
  hash: 'SHA-256',
  publicExponent: new Uint8Array([1, 0, 1]),
  modulusLength: 2048,
};

async function keyPair(): Promise<webcrypto.CryptoKeyPair> {
  return webcrypto.subtle.generateKey(algorithm, true, ['sign', 'verify']);
}

let cached: Promise<TestCertificate> | undefined;

async function create(): Promise<TestCertificate> {
  const notBefore = new Date(Date.now() - 3_600_000);
  const notAfter = new Date(Date.now() + 86_400_000);

  const caKeys = await keyPair();
  const ca = await x509.X509CertificateGenerator.createSelfSigned({
    serialNumber: '01',
    name: 'CN=TronZap SDK Test CA',
    notBefore,
    notAfter,
    keys: caKeys,
    signingAlgorithm: algorithm,
    extensions: [
      new x509.BasicConstraintsExtension(true, undefined, true),
      new x509.KeyUsagesExtension(
        x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign,
        true
      ),
    ],
  });

  const leafKeys = await keyPair();
  const leaf = await x509.X509CertificateGenerator.create({
    serialNumber: '02',
    subject: 'CN=localhost',
    issuer: ca.subject,
    notBefore,
    notAfter,
    publicKey: leafKeys.publicKey,
    signingKey: caKeys.privateKey,
    signingAlgorithm: algorithm,
    extensions: [
      new x509.BasicConstraintsExtension(false),
      new x509.KeyUsagesExtension(
        x509.KeyUsageFlags.digitalSignature | x509.KeyUsageFlags.keyEncipherment,
        true
      ),
      new x509.ExtendedKeyUsageExtension([x509.ExtendedKeyUsage.serverAuth]),
      new x509.SubjectAlternativeNameExtension([{ type: 'dns', value: 'localhost' }]),
    ],
  });

  const key = await webcrypto.subtle.exportKey('pkcs8', leafKeys.privateKey);
  return {
    key: x509.PemConverter.encode(key, 'PRIVATE KEY'),
    cert: leaf.toString('pem'),
    ca: ca.toString('pem'),
  };
}

export async function testCertificate(): Promise<TestCertificate> {
  cached ??= create();
  return cached;
}
