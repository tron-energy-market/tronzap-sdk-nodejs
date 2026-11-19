import { createHash } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ApiError, ErrorCode, InvalidRequestError, ServerError, TronZapClient } from '../src';
import { API_SECRET, API_TOKEN, ApiServer } from './support/server';

const ADDRESS_1 = 'TPY1Kb8cKAZQfm95gXQQs2Mh8Uygtos21D';
const ADDRESS_2 = 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE';

const CSV =
  'row,address,amount,status,reason,charged,transaction_id\n' +
  `1,${ADDRESS_1},65000,delivered,,3.25,01kb2m9c4de5fg6hj7km8np9qr\n` +
  `2,${ADDRESS_2},131000,skipped,address_not_activated,,\n`;

const CALCULATION = {
  id: '01kb2m7a1bc2de3fg4hj5km6np',
  status: 'draft',
  resource: 'energy',
  duration: 1,
  total_amount: 1240.1,
  accepted: 1,
  rejected_count: 0,
  rejected: [],
  expires_at: '2026-11-16T12:15:00+00:00',
};

let server: ApiServer;
let client: TronZapClient;

async function failure(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('The call did not fail');
}

beforeAll(async () => {
  server = await ApiServer.http();
});

afterAll(async () => {
  await server.close();
});

beforeEach(() => {
  server.reset();
  client = new TronZapClient({ apiToken: API_TOKEN, apiSecret: API_SECRET, baseUrl: server.url });
});

describe('request body', () => {
  it.each([
    [
      'bulkCalculate',
      (c: TronZapClient) =>
        c.bulkCalculate(
          [
            { address: ADDRESS_1, amount: 65000 },
            { address: ADDRESS_2, amount: 131000 },
          ],
          24
        ),
      '/v1/bulk/calculate',
      {
        resource: 'energy',
        duration: 24,
        items: [
          { address: ADDRESS_1, amount: 65000 },
          { address: ADDRESS_2, amount: 131000 },
        ],
      },
    ],
    [
      'bulkCalculate duration 0',
      (c: TronZapClient) => c.bulkCalculate([{ address: ADDRESS_1, amount: 65000 }], 0),
      '/v1/bulk/calculate',
      { resource: 'energy', duration: 1, items: [{ address: ADDRESS_1, amount: 65000 }] },
    ],
    [
      'bulkCreate',
      (c: TronZapClient) => c.bulkCreate('calc-1'),
      '/v1/bulk/create',
      { id: 'calc-1' },
    ],
    [
      'bulkCreate full',
      (c: TronZapClient) => c.bulkCreate('calc-1', 'order-42', true, 0, 'https://example.com/hook'),
      '/v1/bulk/create',
      {
        id: 'calc-1',
        force: true,
        max_price_increase: 0,
        webhook_url: 'https://example.com/hook',
        external_id: 'order-42',
      },
    ],
    [
      'bulkCheck',
      (c: TronZapClient) => c.bulkCheck('order-1'),
      '/v1/bulk/check',
      { id: 'order-1' },
    ],
    [
      'bulkCheck by external id',
      (c: TronZapClient) => c.bulkCheck(undefined, 'my-order'),
      '/v1/bulk/check',
      { external_id: 'my-order' },
    ],
    [
      'bulkHistory',
      (c: TronZapClient) => c.bulkHistory(3, 50),
      '/v1/bulk/history',
      { page: 3, per_page: 50 },
    ],
    [
      'bulkHistory defaults',
      (c: TronZapClient) => c.bulkHistory(0, 0),
      '/v1/bulk/history',
      { page: 1, per_page: 10 },
    ],
  ])('%s', async (_name, call, path, expected) => {
    await call(client);

    expect(server.last().path).toBe(path);
    expect(server.last().json()).toStrictEqual(expected);
  });

  it.each([
    ['bulkCalculate without items', (c: TronZapClient) => c.bulkCalculate([])],
    ['bulkCreate without id', (c: TronZapClient) => c.bulkCreate('')],
    ['bulkCheck without ids', (c: TronZapClient) => c.bulkCheck()],
    ['bulkReport without ids', (c: TronZapClient) => c.bulkReport('', '')],
  ])('rejects before sending: %s', async (_name, call) => {
    expect(await failure(call(client))).toBeInstanceOf(InvalidRequestError);
    expect(server.requests).toHaveLength(0);
  });
});

describe('errors with data', () => {
  it('bulkCalculate without valid rows returns them in the error', async () => {
    const rejected = [{ row: 1, address: 'abc', reason: 'invalid_address' }];
    server.respond(200, { code: 94, key: 'bulk_no_valid_items', result: { rejected } });

    const error = await failure(client.bulkCalculate([{ address: 'abc', amount: 65000 }]));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: ErrorCode.BULK_NO_VALID_ITEMS, result: { rejected } });
  });

  it('bulkCreate returns the new calculation when the price changed', async () => {
    server.respond(200, {
      code: 92,
      key: 'bulk_price_changed',
      error: 'Price changed, confirmation required',
      result: CALCULATION,
    });

    const error = await failure(client.bulkCreate('calc-old'));

    expect(error).toMatchObject({
      code: ErrorCode.BULK_PRICE_CHANGED,
      errorKey: 'bulk_price_changed',
      result: CALCULATION,
    });
  });
});

describe('report', () => {
  it('returns the CSV', async () => {
    server.respond(200, CSV, { headers: { 'Content-Type': 'text/csv; charset=UTF-8' } });

    expect(await client.bulkReport('order-1', undefined, 'skipped')).toBe(CSV);
    expect(server.last().path).toBe('/v1/bulk/report');
    expect(server.last().json()).toStrictEqual({ id: 'order-1', status: 'skipped' });
  });

  it('errors are JSON', async () => {
    server.respond(200, { code: 90, key: 'bulk_not_found', error: 'Bulk order not found' });

    const error = await failure(client.bulkReport(undefined, 'missing'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: ErrorCode.BULK_NOT_FOUND });
  });

  it('a JSON success is an invalid response', async () => {
    server.ok({ rows: [] });

    expect(await failure(client.bulkReport('order-1'))).toBeInstanceOf(ServerError);
  });
});

describe('webhook signature', () => {
  const body = '{"id":"01kb2m5x9qj4v8n3c7d6e5f4g3","external_id":"my-order-42","status":"partial"}';
  const signature = createHash('sha256')
    .update(body + API_SECRET)
    .digest('hex');

  it.each([
    ['matches', body, signature, true],
    ['matches a raw body', new TextEncoder().encode(body), signature, true],
    ['ignores case and spaces', body, ` ${signature.toUpperCase()}\n`, true],
    ['rejects another body', `${body} `, signature, false],
    ['rejects an empty signature', body, '', false],
    ['rejects a signature that is not hex', body, 'z'.repeat(64), false],
    ['rejects a truncated signature', body, signature.slice(0, 62), false],
    [
      'rejects another secret',
      body,
      createHash('sha256').update(`${body}other-secret`).digest('hex'),
      false,
    ],
  ])('%s', (_name, received, header, valid) => {
    expect(client.verifyWebhookSignature(received, header)).toBe(valid);
  });
});
