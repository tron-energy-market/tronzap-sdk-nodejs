import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  ConnectionError,
  ErrorCode,
  HttpError,
  InvalidRequestError,
  NetworkError,
  RateLimitError,
  ServerError,
  SslError,
  TimeoutError,
  TronZapClient,
  TronZapError,
  UnauthorizedError,
  type TronZapConfig,
} from '../src';
import { API_SECRET, API_TOKEN, ApiServer, closedPort } from './support/server';

const INSUFFICIENT_FUNDS = {
  code: 6,
  error: 'Insufficient funds',
  key: 'insufficient_funds',
  request_id: 'req-42',
};

let server: ApiServer;
let client: TronZapClient;

function newClient(config: Partial<TronZapConfig> = {}): TronZapClient {
  return new TronZapClient({
    apiToken: API_TOKEN,
    apiSecret: API_SECRET,
    baseUrl: server.url,
    ...config,
  });
}

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
  client = newClient();
});

describe('API errors', () => {
  it.each([200, 400, 401, 403, 429, 500, 503])('win over HTTP %i', async status => {
    server.respond(status, INSUFFICIENT_FUNDS);

    const error = await failure(client.getBalance());

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      name: 'ApiError',
      code: ErrorCode.INSUFFICIENT_FUNDS,
      message: 'Insufficient funds',
      errorKey: 'insufficient_funds',
      requestId: 'req-42',
      statusCode: status,
    });
  });

  it('without a message, key or request id', async () => {
    server.respond(200, { code: 10 });

    const error = await failure(client.getBalance());

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: ErrorCode.INVALID_TRON_ADDRESS,
      message: 'Unknown API error',
      errorKey: null,
      requestId: null,
    });
  });

  it('with fields of the wrong type', async () => {
    server.respond(200, { code: 6, error: 42, key: false, request_id: 7 });

    const error = await failure(client.getBalance());

    expect(error).toMatchObject({
      code: 6,
      message: 'Unknown API error',
      errorKey: null,
      requestId: null,
    });
  });

  it.each([
    ['missing code', { result: { balance: 1 } }],
    ['string code', { code: '6' }],
    ['fractional code', { code: 1.5 }],
  ])('%s is an API error with code 1', async (_name, body) => {
    server.respond(200, body);

    const error = await failure(client.getBalance());

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe(1);
  });

  it.each(['[]', '[1,2]', '"text"', '42', 'null', 'true'])(
    'JSON %s that is not an object',
    async body => {
      server.respond(200, body);

      const error = await failure(client.getBalance());

      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).code).toBe(1);
    }
  );
});

describe('HTTP errors', () => {
  it.each([
    [401, UnauthorizedError],
    [403, UnauthorizedError],
    [429, RateLimitError],
    [500, ServerError],
    [502, ServerError],
    [404, HttpError],
  ])('HTTP %i without an API payload', async (status, type) => {
    server.respond(status, '<html>gateway</html>');

    const error = await failure(client.getBalance());

    expect(error).toBeInstanceOf(type);
    expect((error as HttpError).constructor).toBe(type);
    expect(error).toMatchObject({
      statusCode: status,
      code: status,
      responseBody: '<html>gateway</html>',
    });
  });

  it('HTTP error with a successful API code', async () => {
    server.respond(500, { code: 0, result: {} });

    const error = await failure(client.getBalance());

    expect(error).toBeInstanceOf(ServerError);
    expect((error as ServerError).statusCode).toBe(500);
  });

  it.each([
    ['text', 'not json'],
    ['empty', ''],
    ['truncated', '{"code": 0, "result": '],
    ['no result', '{"code": 0}'],
    ['null result', '{"code": 0, "result": null}'],
    ['string result', '{"code": 0, "result": "ok"}'],
    ['number result', '{"code": 0, "result": 1}'],
  ])('invalid successful response: %s', async (_name, body) => {
    server.respond(200, body);

    const error = await failure(client.getBalance());

    expect(error).toBeInstanceOf(ServerError);
    expect(error).toMatchObject({ statusCode: 200, responseBody: body });
  });
});

describe('network errors', () => {
  it('connection refused', async () => {
    const port = await closedPort();

    const error = await failure(
      newClient({ baseUrl: `http://127.0.0.1:${String(port)}` }).getBalance()
    );

    expect((error as NetworkError).constructor).toBe(ConnectionError);
    expect(error).toMatchObject({ code: 0 });
    expect((error as NetworkError).originalError).toBeInstanceOf(Error);
  });

  it('unknown host', async () => {
    const error = await failure(
      newClient({ baseUrl: 'http://tronzap-sdk-test.invalid' }).getBalance()
    );

    expect((error as NetworkError).constructor).toBe(ConnectionError);
  });

  it('other request failures are network errors', async () => {
    const error = await failure(
      newClient({ baseUrl: 'unsupported://api.tronzap.com' }).getBalance()
    );

    expect((error as NetworkError).constructor).toBe(NetworkError);
  });

  const node = (code: string | undefined, message: string): Error =>
    new TypeError('fetch failed', { cause: Object.assign(new Error(message), { code }) });
  const bun = (code: string, message: string): Error =>
    Object.assign(new TypeError(message), { code });
  const deno = (message: string): Error =>
    new TypeError('fetch failed', {
      cause: new Error(`error sending request for url: client error (Connect): ${message}`),
    });

  it.each([
    [
      'Node untrusted',
      node('UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'unable to verify the first certificate'),
      SslError,
    ],
    ['Node self-signed', node('DEPTH_ZERO_SELF_SIGNED_CERT', 'self-signed certificate'), SslError],
    ['Node expired', node('CERT_HAS_EXPIRED', 'certificate has expired'), SslError],
    [
      'Node host mismatch',
      node('ERR_TLS_CERT_ALTNAME_INVALID', 'Hostname/IP does not match'),
      SslError,
    ],
    ['Node protocol', node('ERR_SSL_WRONG_VERSION_NUMBER', 'wrong version number'), SslError],
    ['Node refused', node('ECONNREFUSED', 'connect ECONNREFUSED'), ConnectionError],
    ['Node reset', node('ECONNRESET', 'read ECONNRESET'), ConnectionError],
    ['Node DNS', node('ENOTFOUND', 'getaddrinfo ENOTFOUND'), ConnectionError],
    ['Node DNS again', node('EAI_AGAIN', 'getaddrinfo EAI_AGAIN'), ConnectionError],
    ['Node unreachable', node('ENETUNREACH', 'connect ENETUNREACH'), ConnectionError],
    ['Node socket closed', node('UND_ERR_SOCKET', 'other side closed'), ConnectionError],
    [
      'Node connect timeout',
      node('UND_ERR_CONNECT_TIMEOUT', 'Connect Timeout Error'),
      TimeoutError,
    ],
    ['Node OS timeout', node('ETIMEDOUT', 'connect ETIMEDOUT'), TimeoutError],
    ['Node other', node(undefined, 'unknown scheme'), NetworkError],
    ['Bun self-signed', bun('DEPTH_ZERO_SELF_SIGNED_CERT', 'self signed certificate'), SslError],
    ['Bun refused', bun('ConnectionRefused', 'Unable to connect'), ConnectionError],
    [
      'Bun closed',
      bun('ConnectionClosed', 'The socket connection was closed unexpectedly'),
      ConnectionError,
    ],
    ['Bun DNS', bun('ENOTFOUND', 'getaddrinfo ENOTFOUND'), ConnectionError],
    ['Deno untrusted', deno('invalid peer certificate: UnknownIssuer'), SslError],
    ['Deno refused', deno('tcp connect error: Connection refused (os error 61)'), ConnectionError],
    ['Deno DNS', deno('dns error: failed to lookup address information'), ConnectionError],
    ['plain error', new Error('boom'), NetworkError],
  ])('%s is classified', async (_name, thrown, type) => {
    const failing = newClient({ fetch: () => Promise.reject(thrown) });

    const error = await failure(failing.getBalance());

    expect((error as NetworkError).constructor).toBe(type);
    expect((error as NetworkError).originalError).toBe(thrown);
  });

  it('a non-error rejection is a network error', async () => {
    const failing = newClient({
      fetch: () => {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject('down');
      },
    });

    const error = await failure(failing.getBalance());

    expect((error as NetworkError).constructor).toBe(NetworkError);
    expect((error as NetworkError).message).toBe('down');
  });
});

describe('timeout and cancellation', () => {
  it('times out waiting for the response', async () => {
    server.respond(200, { code: 0, result: {} }, { delayMs: 2000 });
    const started = Date.now();

    const error = await failure(newClient({ timeout: 300 }).getBalance());

    expect((error as TimeoutError).constructor).toBe(TimeoutError);
    expect(Date.now() - started).toBeLessThan(1500);
  });

  it('times out reading the body', async () => {
    server.respond(200, { code: 0, result: {} }, { bodyDelayMs: 2000 });

    const error = await failure(newClient({ timeout: 300 }).getBalance());

    expect((error as TimeoutError).constructor).toBe(TimeoutError);
  });

  it('per request timeout overrides the client one', async () => {
    server.respond(200, { code: 0, result: {} }, { delayMs: 2000 });

    const error = await failure(client.getBalance({ timeout: 300 }));

    expect((error as TimeoutError).constructor).toBe(TimeoutError);
  });

  it('defaults to 30 seconds', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    try {
      await client.getBalance();
      expect(timeout).toHaveBeenCalledWith(30_000);
    } finally {
      timeout.mockRestore();
    }
  });

  it('cancellation rejects with the reason of the signal, not a timeout', async () => {
    server.respond(200, { code: 0, result: {} }, { delayMs: 2000 });
    const controller = new AbortController();
    const reason = new Error('user cancelled');
    setTimeout(() => {
      controller.abort(reason);
    }, 100);

    const error = await failure(client.getBalance({ signal: controller.signal }));

    expect(error).toBe(reason);
  });

  it('cancellation without a reason rejects with an AbortError', async () => {
    server.respond(200, { code: 0, result: {} }, { delayMs: 2000 });
    const controller = new AbortController();
    setTimeout(() => {
      controller.abort();
    }, 100);

    const error = await failure(client.getBalance({ signal: controller.signal }));

    expect(error).not.toBeInstanceOf(TronZapError);
    expect((error as Error).name).toBe('AbortError');
  });

  it('an aborted signal sends nothing', async () => {
    const reason = new Error('already cancelled');

    const error = await failure(client.getBalance({ signal: AbortSignal.abort(reason) }));

    expect(error).toBe(reason);
    expect(server.requests).toHaveLength(0);
  });

  it('every method takes request options', async () => {
    const signal = AbortSignal.abort(new Error('stop'));
    const calls = [
      client.getServices({ signal }),
      client.getAddressInfo('T', { signal }),
      client.estimateEnergy('T', 'T', undefined, { signal }),
      client.calculate('T', 65000, 1, { signal }),
      client.createEnergyTransaction('T', 65000, 1, undefined, false, { signal }),
      client.createBandwidthTransaction('T', 345, undefined, { signal }),
      client.createResourceBundleTransaction('T', 65000, 345, 1, undefined, false, { signal }),
      client.createAddressActivationTransaction('T', undefined, { signal }),
      client.createAmlCheck('address', 'TRX', 'T', undefined, undefined, { signal }),
      client.checkTransaction('tx', undefined, { signal }),
      client.checkAmlStatus('aml', { signal }),
      client.getAmlServices({ signal }),
      client.getAmlHistory(1, 10, undefined, { signal }),
      client.getDirectRechargeInfo({ signal }),
      client.request('/v1/balance', {}, { signal }),
    ];

    for (const call of calls) {
      expect(((await failure(call)) as Error).message).toBe('stop');
    }
    expect(server.requests).toHaveLength(0);
  });
});

describe('configuration', () => {
  it.each([
    ['token', { apiToken: '' }],
    ['secret', { apiSecret: '' }],
    ['base URL', { baseUrl: '/' }],
    ['zero timeout', { timeout: 0 }],
    ['negative timeout', { timeout: -1 }],
    ['NaN timeout', { timeout: Number.NaN }],
    ['infinite timeout', { timeout: Number.POSITIVE_INFINITY }],
  ])('rejects an invalid %s', (_name, config) => {
    expect(() => newClient(config)).toThrow(InvalidRequestError);
  });

  it('rejects an invalid per request timeout before sending', async () => {
    const error = await failure(client.getBalance({ timeout: 0 }));

    expect(error).toBeInstanceOf(InvalidRequestError);
    expect(server.requests).toHaveLength(0);
  });

  it('uses the production API by default', async () => {
    const seen: string[] = [];
    const recording = new TronZapClient({
      apiToken: API_TOKEN,
      apiSecret: API_SECRET,
      fetch: input => {
        seen.push(input);
        return Promise.resolve(new Response('{"code":0,"result":{}}'));
      },
    });

    await recording.getBalance();

    expect(seen).toStrictEqual(['https://api.tronzap.com/v1/balance']);
  });
});

describe('types', () => {
  it.each([
    [ApiError, TronZapError],
    [NetworkError, TronZapError],
    [ConnectionError, NetworkError],
    [TimeoutError, NetworkError],
    [SslError, NetworkError],
    [HttpError, TronZapError],
    [ServerError, HttpError],
    [RateLimitError, HttpError],
    [UnauthorizedError, HttpError],
    [InvalidRequestError, TronZapError],
    [TronZapError, Error],
  ])('%o extends %o', (type, parent) => {
    expect(Object.getPrototypeOf(type.prototype)).toBe(parent.prototype);
  });

  it('error names match the classes', () => {
    expect(new InvalidRequestError('x').name).toBe('InvalidRequestError');
    expect(new ApiError(1, 'x').name).toBe('ApiError');
  });

  it('API error defaults', () => {
    expect(new ApiError(6, 'x')).toMatchObject({ errorKey: null, requestId: null, statusCode: 0 });
  });

  it('error codes', () => {
    expect(
      Object.fromEntries(Object.entries(ErrorCode).filter(([key]) => Number.isNaN(Number(key))))
    ).toStrictEqual({
      AUTH_ERROR: 1,
      INVALID_SERVICE_OR_PARAMS: 2,
      WALLET_NOT_FOUND: 5,
      INSUFFICIENT_FUNDS: 6,
      INVALID_TRON_ADDRESS: 10,
      INVALID_ENERGY_AMOUNT: 11,
      INVALID_DURATION: 12,
      TRANSACTION_NOT_FOUND: 20,
      CANNOT_STOP_SUBSCRIPTION: 21,
      ADDRESS_NOT_ACTIVATED: 24,
      ADDRESS_ALREADY_ACTIVATED: 25,
      AML_CHECK_NOT_FOUND: 30,
      SERVICE_NOT_AVAILABLE: 35,
      INVALID_BANDWIDTH_AMOUNT: 50,
      INTERNAL_SERVER_ERROR: 500,
      UNKNOWN_ERROR: 999,
    });
  });
});
