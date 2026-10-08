import { afterEach, expect, it } from 'vitest';
import { SslError, TronZapClient } from '../src';
import { testCertificate } from './support/certificate';
import { ApiServer } from './support/server';

let server: ApiServer;

afterEach(async () => {
  await server.close();
});

it('rejects a certificate from an untrusted authority before sending anything', async () => {
  server = await ApiServer.https(testCertificate());
  const client = new TronZapClient({ apiToken: 'token', apiSecret: 'secret', baseUrl: server.url });

  await expect(client.getBalance()).rejects.toBeInstanceOf(SslError);
  expect(server.requests).toHaveLength(0);
});

it('rejects a certificate through a custom fetch as well', async () => {
  server = await ApiServer.https(testCertificate(), '127.0.0.1');
  const client = new TronZapClient({
    apiToken: 'token',
    apiSecret: 'secret',
    baseUrl: server.url,
    fetch: (input, init) => fetch(input, init),
  });

  await expect(client.getBalance()).rejects.toBeInstanceOf(SslError);
  expect(server.requests).toHaveLength(0);
});
