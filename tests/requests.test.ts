import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { InvalidRequestError, ServerError, TronZapClient } from '../src';
import { API_SECRET, API_TOKEN, ApiServer } from './support/server';

const ADDRESS = 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE';
const FROM_ADDRESS = 'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8';
const TO_ADDRESS = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj';
const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

type Call = (client: TronZapClient) => Promise<unknown>;

const requests: [string, Call, string, Record<string, unknown>][] = [
  ['getServices', c => c.getServices(), '/v1/services', {}],
  ['getBalance', c => c.getBalance(), '/v1/balance', {}],
  ['getAddressInfo', c => c.getAddressInfo(ADDRESS), '/v1/address-info', { address: ADDRESS }],
  [
    'estimateEnergy',
    c => c.estimateEnergy(FROM_ADDRESS, TO_ADDRESS, USDT_CONTRACT),
    '/v1/estimate-energy',
    { from_address: FROM_ADDRESS, to_address: TO_ADDRESS, contract_address: USDT_CONTRACT },
  ],
  [
    'estimateEnergy without contract',
    c => c.estimateEnergy(FROM_ADDRESS, TO_ADDRESS),
    '/v1/estimate-energy',
    { from_address: FROM_ADDRESS, to_address: TO_ADDRESS },
  ],
  [
    'estimateEnergy with empty contract',
    c => c.estimateEnergy(FROM_ADDRESS, TO_ADDRESS, ''),
    '/v1/estimate-energy',
    { from_address: FROM_ADDRESS, to_address: TO_ADDRESS },
  ],
  [
    'calculate',
    c => c.calculate(ADDRESS, 65000, 24),
    '/v1/calculate',
    { address: ADDRESS, amount: 65000, duration: 24 },
  ],
  [
    'calculate default duration',
    c => c.calculate(ADDRESS, 65000),
    '/v1/calculate',
    { address: ADDRESS, amount: 65000, duration: 1 },
  ],
  [
    'calculate duration 0',
    c => c.calculate(ADDRESS, 65000, 0),
    '/v1/calculate',
    { address: ADDRESS, amount: 65000, duration: 1 },
  ],
  [
    'createEnergyTransaction',
    c => c.createEnergyTransaction(ADDRESS, 65000),
    '/v1/transaction/new',
    { service: 'energy', params: { address: ADDRESS, amounts: { energy: 65000 }, duration: 1 } },
  ],
  [
    'createEnergyTransaction full',
    c => c.createEnergyTransaction(ADDRESS, 65000, 24, 'order-1', true),
    '/v1/transaction/new',
    {
      service: 'energy',
      external_id: 'order-1',
      params: {
        address: ADDRESS,
        amounts: { energy: 65000 },
        duration: 24,
        activate_address: true,
      },
    },
  ],
  [
    'createEnergyTransaction duration 0',
    c => c.createEnergyTransaction(ADDRESS, 65000, 0),
    '/v1/transaction/new',
    { service: 'energy', params: { address: ADDRESS, amounts: { energy: 65000 }, duration: 1 } },
  ],
  [
    'createBandwidthTransaction',
    c => c.createBandwidthTransaction(ADDRESS, 345, 'order-2'),
    '/v1/transaction/new',
    {
      service: 'bandwidth',
      external_id: 'order-2',
      params: { address: ADDRESS, amounts: { bandwidth: 345 }, duration: 1 },
    },
  ],
  [
    'createBandwidthTransaction minimal',
    c => c.createBandwidthTransaction(ADDRESS, 345),
    '/v1/transaction/new',
    {
      service: 'bandwidth',
      params: { address: ADDRESS, amounts: { bandwidth: 345 }, duration: 1 },
    },
  ],
  [
    'createResourceBundleTransaction',
    c => c.createResourceBundleTransaction(ADDRESS, 65000, 345, 1, 'order-3', true),
    '/v1/transaction/new',
    {
      service: 'resource_bundle',
      external_id: 'order-3',
      params: {
        address: ADDRESS,
        amounts: { energy: 65000, bandwidth: 345 },
        duration: 1,
        activate_address: true,
      },
    },
  ],
  [
    'createResourceBundleTransaction minimal',
    c => c.createResourceBundleTransaction(ADDRESS, 65000, 345),
    '/v1/transaction/new',
    {
      service: 'resource_bundle',
      params: { address: ADDRESS, amounts: { energy: 65000, bandwidth: 345 }, duration: 1 },
    },
  ],
  [
    'createAddressActivationTransaction',
    c => c.createAddressActivationTransaction(ADDRESS, 'order-4'),
    '/v1/transaction/new',
    { service: 'activate_address', external_id: 'order-4', params: { address: ADDRESS } },
  ],
  [
    'createAddressActivationTransaction minimal',
    c => c.createAddressActivationTransaction(ADDRESS),
    '/v1/transaction/new',
    { service: 'activate_address', params: { address: ADDRESS } },
  ],
  [
    'external id "0" is sent',
    c => c.createAddressActivationTransaction(ADDRESS, '0'),
    '/v1/transaction/new',
    { service: 'activate_address', external_id: '0', params: { address: ADDRESS } },
  ],
  [
    'empty external id is left out',
    c => c.createAddressActivationTransaction(ADDRESS, ''),
    '/v1/transaction/new',
    { service: 'activate_address', params: { address: ADDRESS } },
  ],
  [
    'checkTransaction by id',
    c => c.checkTransaction('tx-1'),
    '/v1/transaction/check',
    { id: 'tx-1' },
  ],
  [
    'checkTransaction by external id',
    c => c.checkTransaction(undefined, 'order-1'),
    '/v1/transaction/check',
    { external_id: 'order-1' },
  ],
  [
    'checkTransaction by both ids',
    c => c.checkTransaction('tx-1', 'order-1'),
    '/v1/transaction/check',
    { id: 'tx-1', external_id: 'order-1' },
  ],
  ['getDirectRechargeInfo', c => c.getDirectRechargeInfo(), '/v1/direct-recharge-info', {}],
  ['getAmlServices', c => c.getAmlServices(), '/v1/aml-checks', {}],
  [
    'createAmlCheck address',
    c => c.createAmlCheck('address', 'TRX', ADDRESS),
    '/v1/aml-checks/new',
    { type: 'address', network: 'TRX', address: ADDRESS },
  ],
  [
    'createAmlCheck hash',
    c => c.createAmlCheck('hash', 'TRX', ADDRESS, 'abc123', 'withdrawal'),
    '/v1/aml-checks/new',
    { type: 'hash', network: 'TRX', address: ADDRESS, hash: 'abc123', direction: 'withdrawal' },
  ],
  [
    'createAmlCheck hash without direction',
    c => c.createAmlCheck('hash', 'TRX', ADDRESS, 'abc123'),
    '/v1/aml-checks/new',
    { type: 'hash', network: 'TRX', address: ADDRESS, hash: 'abc123', direction: 'deposit' },
  ],
  [
    'createAmlCheck hash with empty direction',
    c => c.createAmlCheck('hash', 'TRX', ADDRESS, 'abc123', ''),
    '/v1/aml-checks/new',
    { type: 'hash', network: 'TRX', address: ADDRESS, hash: 'abc123', direction: 'deposit' },
  ],
  ['checkAmlStatus', c => c.checkAmlStatus('aml-1'), '/v1/aml-checks/check', { id: 'aml-1' }],
  ['getAmlHistory', c => c.getAmlHistory(), '/v1/aml-checks/history', { page: 1, per_page: 10 }],
  [
    'getAmlHistory filtered',
    c => c.getAmlHistory(3, 50, 'completed'),
    '/v1/aml-checks/history',
    { page: 3, per_page: 50, status: 'completed' },
  ],
  [
    'getAmlHistory paging 0',
    c => c.getAmlHistory(0, 0),
    '/v1/aml-checks/history',
    { page: 1, per_page: 10 },
  ],
  ['getSubscriptions', c => c.getSubscriptions(), '/v1/subscriptions', {}],
  [
    'startSubscription',
    c => c.startSubscription('unlimited_energy', 'TAddress'),
    '/v1/subscription/start',
    {
      subscription_id: 'unlimited_energy',
      params: { address: 'TAddress', duration: 0, transactions_limit: 0 },
    },
  ],
  [
    'startSubscription full',
    c => c.startSubscription('unlimited_energy', 'TAddress', 30, 10, 'sub-1', true),
    '/v1/subscription/start',
    {
      subscription_id: 'unlimited_energy',
      external_id: 'sub-1',
      params: { address: 'TAddress', duration: 30, transactions_limit: 10, activate_address: true },
    },
  ],
  [
    'startSubscription external id "0" is sent',
    c => c.startSubscription('unlimited_energy', 'TAddress', 0, 0, '0'),
    '/v1/subscription/start',
    {
      subscription_id: 'unlimited_energy',
      external_id: '0',
      params: { address: 'TAddress', duration: 0, transactions_limit: 0 },
    },
  ],
  [
    'checkSubscription by id',
    c => c.checkSubscription('sub-id'),
    '/v1/subscription/check',
    { id: 'sub-id' },
  ],
  [
    'checkSubscription by external id',
    c => c.checkSubscription(undefined, 'sub-1'),
    '/v1/subscription/check',
    { external_id: 'sub-1' },
  ],
  [
    'stopSubscription by both ids',
    c => c.stopSubscription('sub-id', 'sub-1'),
    '/v1/subscription/stop',
    { id: 'sub-id', external_id: 'sub-1' },
  ],
  [
    'getSubscriptionHistory',
    c => c.getSubscriptionHistory(),
    '/v1/subscriptions/history',
    { page: 1, per_page: 10 },
  ],
  [
    'getSubscriptionHistory filtered',
    c => c.getSubscriptionHistory(2, 50, 'active'),
    '/v1/subscriptions/history',
    { page: 2, per_page: 50, status: 'active' },
  ],
  [
    'getSubscriptionHistory paging 0',
    c => c.getSubscriptionHistory(0, 0, ''),
    '/v1/subscriptions/history',
    { page: 1, per_page: 10 },
  ],
];

const invalidCalls: [string, Call][] = [
  ['getAddressInfo without address', c => c.getAddressInfo('')],
  ['estimateEnergy without from', c => c.estimateEnergy('', TO_ADDRESS)],
  ['estimateEnergy without to', c => c.estimateEnergy(FROM_ADDRESS, '')],
  ['calculate without address', c => c.calculate('', 65000)],
  ['energy without address', c => c.createEnergyTransaction('', 65000)],
  ['bandwidth without address', c => c.createBandwidthTransaction('', 345)],
  ['bundle without address', c => c.createResourceBundleTransaction('', 65000, 345)],
  ['activation without address', c => c.createAddressActivationTransaction('')],
  ['checkTransaction without ids', c => c.checkTransaction()],
  ['checkTransaction with empty ids', c => c.checkTransaction('', '')],
  ['aml check without type', c => c.createAmlCheck('', 'TRX', ADDRESS)],
  ['aml check without network', c => c.createAmlCheck('address', '', ADDRESS)],
  ['aml check without address', c => c.createAmlCheck('address', 'TRX', '')],
  ['aml status without id', c => c.checkAmlStatus('')],
  ['subscription without plan', c => c.startSubscription('', 'TAddress')],
  ['subscription without address', c => c.startSubscription('unlimited_energy', '')],
  ['subscription with negative days', c => c.startSubscription('unlimited_energy', 'TAddress', -1)],
  [
    'subscription with negative limit',
    c => c.startSubscription('unlimited_energy', 'TAddress', 0, -1),
  ],
  ['subscription with NaN days', c => c.startSubscription('unlimited_energy', 'TAddress', NaN)],
  ['checkSubscription without ids', c => c.checkSubscription()],
  ['stopSubscription with empty ids', c => c.stopSubscription('', '')],
  ['params that are not JSON', c => c.request('/v1/balance', { amount: 1n })],
  ['endpoint without a leading slash', c => c.request('v1/balance')],
];

let server: ApiServer;
let client: TronZapClient;

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
  it.each(requests)('%s', async (_name, call, path, expected) => {
    await call(client);

    expect(server.requests).toHaveLength(1);
    expect(server.last().method).toBe('POST');
    expect(server.last().path).toBe(path);
    expect(server.last().json()).toStrictEqual(expected);
  });

  it('sends empty params as an object', async () => {
    await client.getBalance();

    expect(server.last().body).toBe('{}');
  });
});

describe('signature', () => {
  it.each(requests)('is sha256 of the body actually sent: %s', async (_name, call) => {
    await call(client);

    const received = server.last();
    expect(received.headers['x-signature']).toBe(received.expectedSignature());
  });

  it('covers a non-ASCII body', async () => {
    await client.checkTransaction(undefined, 'pedido-año-订单-😀');

    const received = server.last();
    expect(received.json()).toStrictEqual({ external_id: 'pedido-año-订单-😀' });
    expect(received.headers['x-signature']).toBe(received.expectedSignature());
  });
});

describe('client', () => {
  it('sends the token and the content type', async () => {
    await client.getBalance();

    expect(server.last().headers.authorization).toBe(`Bearer ${API_TOKEN}`);
    expect(server.last().headers['content-type']).toBe('application/json');
  });

  it('returns the result field', async () => {
    server.ok({ balance: '12.5', address: ADDRESS });

    await expect(client.getBalance()).resolves.toStrictEqual({ balance: '12.5', address: ADDRESS });
  });

  it('returns list results', async () => {
    server.ok([{ id: 'address', price: 1 }]);

    await expect(client.getAmlServices()).resolves.toStrictEqual([{ id: 'address', price: 1 }]);
  });

  it('returns an empty list result', async () => {
    server.ok([]);

    await expect(client.getAmlServices()).resolves.toStrictEqual([]);
  });

  it('ignores a trailing slash of the base URL', async () => {
    const withSlash = new TronZapClient({
      apiToken: API_TOKEN,
      apiSecret: API_SECRET,
      baseUrl: `${server.url}/`,
    });

    await withSlash.getBalance();

    expect(server.last().path).toBe('/v1/balance');
  });

  it('sends concurrent requests with their own bodies and signatures', async () => {
    const ids = Array.from({ length: 20 }, (_, i) => `tx-${String(i)}`);

    await Promise.all(ids.map(id => client.checkTransaction(id)));

    expect(server.requests.map(r => (r.json() as { id: string }).id).sort()).toStrictEqual(
      [...ids].sort()
    );
    for (const received of server.requests) {
      expect(received.headers['x-signature']).toBe(received.expectedSignature());
    }
  });

  it('uses the fetch function from the config', async () => {
    const custom = vi.fn((input: string, init: RequestInit) => fetch(input, init));
    const withFetch = new TronZapClient({
      apiToken: API_TOKEN,
      apiSecret: API_SECRET,
      baseUrl: server.url,
      fetch: custom,
    });

    await withFetch.getBalance();

    expect(custom).toHaveBeenCalledOnce();
    expect(server.requests).toHaveLength(1);
  });

  it('looks up the global fetch on every request', async () => {
    const original = globalThis.fetch;
    const replaced = vi.fn(original);
    globalThis.fetch = replaced;
    try {
      await client.getBalance();
    } finally {
      globalThis.fetch = original;
    }

    expect(replaced).toHaveBeenCalledOnce();
  });

  it('exposes the version', async () => {
    const { VERSION } = await import('../src');
    const { version } = (await import('../package.json')).default;

    expect(VERSION).toBe(version);
  });
});

describe('invalid arguments', () => {
  it.each(invalidCalls)('are rejected before sending: %s', async (_name, call) => {
    const error: unknown = await call(client).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(InvalidRequestError);
    expect((error as InvalidRequestError).code).toBe(0);
    expect(server.requests).toHaveLength(0);
  });
});

describe('subscriptions', () => {
  const subscription = {
    id: '01m4e1z3q0r7x225zc6p63m5ey',
    subscription_id: 'unlimited_energy',
    created_at: '2026-10-08T15:26:32+00:00',
    expire_at: '2026-11-07T15:26:32+00:00',
    address: 'TAddress',
    status: 'active',
    external_id: 'sub-1',
    params: { address: 'TAddress', duration: 30, transactions_limit: 0, activate_address: false },
  };

  it('returns the plans keyed by subscription id in the API order', async () => {
    server.respond(
      200,
      '{"code":0,"result":{' +
        '"unlimited_energy":{"id":8,"name":"Unlimited Energy","activation_fee":0,"initial_price":8,' +
        '"price":2.8,"transactions_limit":0,"duration_days":0},' +
        '"energy_pack_100":{"id":2,"name":"Energy Pack","activation_fee":"2.0","initial_price":"20.00",' +
        '"price":"1.5","transactions_limit":10,"duration_days":5}}}'
    );

    const plans: Record<string, unknown> = await client.getSubscriptions();

    expect(Object.keys(plans)).toStrictEqual(['unlimited_energy', 'energy_pack_100']);
    expect(plans.unlimited_energy).toStrictEqual({
      id: 8,
      name: 'Unlimited Energy',
      activation_fee: 0,
      initial_price: 8,
      price: 2.8,
      transactions_limit: 0,
      duration_days: 0,
    });
    expect(plans.energy_pack_100).toHaveProperty('activation_fee', '2.0');
  });

  it.each([{}, []])('returns no plans for %j', async result => {
    server.ok(result);

    await expect(client.getSubscriptions()).resolves.toStrictEqual({});
  });

  it('rejects plans that are not an object', async () => {
    server.ok('unlimited_energy');

    await expect(client.getSubscriptions()).rejects.toBeInstanceOf(ServerError);
  });

  it.each([
    ['start', (c: TronZapClient) => c.startSubscription('unlimited_energy', 'TAddress', 30)],
    ['check', (c: TronZapClient) => c.checkSubscription(subscription.id)],
  ])('returns the subscription from %s', async (_name, call) => {
    server.ok(subscription);

    await expect(call(client)).resolves.toStrictEqual(subscription);
  });

  it('returns a stopped subscription without address and expiry', async () => {
    const stopped: Record<string, unknown> = {
      ...subscription,
      status: 'stopped',
      stopped_at: '2026-10-08T15:28:44+00:00',
    };
    delete stopped.address;
    delete stopped.expire_at;
    server.ok(stopped);

    const result: unknown = await client.stopSubscription(subscription.id);

    expect(result).toStrictEqual(stopped);
    expect(result).not.toHaveProperty('address');
  });

  it('returns the history with usage counters', async () => {
    const item = {
      id: subscription.id,
      status: 'active',
      subscription_id: 'unlimited_energy',
      address: 'TAddress',
      transactions_limit: 0,
      transactions_used: 4,
      energy_used: 262000,
      total_price: '8.00',
      started_at: '2026-10-08T15:26:33+00:00',
      renewed_at: '2026-10-08T15:27:35+00:00',
      stopped_at: null,
      expire_at: '2026-11-07T15:26:32+00:00',
      created_at: '2026-10-08T15:26:32+00:00',
    };
    server.ok({ page: 1, per_page: 10, total: 1, items: [item] });

    const history: unknown = await client.getSubscriptionHistory();

    expect(history).toStrictEqual({ page: 1, per_page: 10, total: 1, items: [item] });
  });
});
