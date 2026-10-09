import { createHash } from 'node:crypto';
import {
  ApiError,
  type ApiResult,
  ConnectionError,
  HttpError,
  InvalidRequestError,
  NetworkError,
  RateLimitError,
  type RequestOptions,
  ServerError,
  SslError,
  TimeoutError,
  type TronZapConfig,
  UnauthorizedError,
} from './types';

const DEFAULT_BASE_URL = 'https://api.tronzap.com';
const DEFAULT_TIMEOUT = 30_000;

const CONNECTION_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EPIPE',
  'UND_ERR_SOCKET',
  'ConnectionRefused',
  'ConnectionClosed',
  'FailedToOpenSocket',
]);
const TIMEOUT_CODES = new Set(['ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT']);
const SSL_CODE = /CERT|SSL|TLS|SELF_SIGNED|UNABLE_TO_(VERIFY|GET_ISSUER)/;
// Deno reports network failures only as text.
const SSL_MESSAGE = /certificate|tls handshake/i;
const CONNECTION_MESSAGE = /tcp connect error|dns error|connection (refused|reset|closed)/i;

type Params = Record<string, unknown>;

function causes(error: Error): { codes: string[]; messages: string[]; deepest: Error } {
  const codes: string[] = [];
  const messages: string[] = [];
  let deepest = error;
  for (let current: unknown = error, depth = 0; current instanceof Error && depth < 5; depth++) {
    const { code } = current as { code?: unknown };
    if (typeof code === 'string') {
      codes.push(code);
    }
    messages.push(current.message);
    deepest = current;
    current = current.cause;
  }
  return { codes, messages, deepest };
}

function networkError(error: unknown): NetworkError {
  const original = error instanceof Error ? error : new Error(String(error));
  const { codes, messages, deepest } = causes(original);
  const { message } = deepest;

  if (codes.some(code => TIMEOUT_CODES.has(code))) {
    return new TimeoutError(message, original);
  }
  if (codes.some(code => SSL_CODE.test(code)) || messages.some(text => SSL_MESSAGE.test(text))) {
    return new SslError(message, original);
  }
  if (
    codes.some(code => CONNECTION_CODES.has(code)) ||
    messages.some(text => CONNECTION_MESSAGE.test(text))
  ) {
    return new ConnectionError(message, original);
  }
  return new NetworkError(message, original);
}

function httpError(status: number, body: string): HttpError {
  if (status === 429) {
    return new RateLimitError('Too many requests', body);
  }
  if (status === 401 || status === 403) {
    return new UnauthorizedError(status, 'Unauthorized', body);
  }
  if (status >= 500) {
    return new ServerError(status, 'Server error', body);
  }
  return new HttpError(status, `HTTP error ${String(status)}`, body);
}

function apiError(payload: unknown, status: number): ApiError {
  const fields: Params = typeof payload === 'object' && payload !== null ? (payload as Params) : {};
  const text = (value: unknown): string | null => (typeof value === 'string' ? value : null);
  const code = Number.isInteger(fields.code) ? (fields.code as number) : 1;
  return new ApiError(
    code,
    text(fields.error) ?? 'Unknown API error',
    text(fields.key),
    text(fields.request_id),
    status
  );
}

function parseJson(body: string): { value: unknown } | null {
  try {
    return { value: JSON.parse(body) };
  } catch {
    return null;
  }
}

function isObject(value: unknown): value is Params {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function timeoutOf(value: number | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }
  if (!Number.isFinite(value) || value <= 0) {
    throw new InvalidRequestError('timeout must be a positive number of milliseconds');
  }
  return value;
}

function required(name: string, value: string | null | undefined): string {
  if (value === undefined || value === null || value === '') {
    throw new InvalidRequestError(`${name} is required`);
  }
  return value;
}

function present(value: string | null | undefined): value is string {
  return value !== undefined && value !== null && value !== '';
}

function notNegative(name: string, value: number): number {
  if (!(value >= 0)) {
    throw new InvalidRequestError(`${name} cannot be negative`);
  }
  return value;
}

function atLeast(value: number, minimum: number, fallback: number): number {
  return value >= minimum ? value : fallback;
}

export class TronZapClient {
  private readonly baseUrl: string;
  private readonly apiToken: string;
  private readonly apiSecret: string;
  private readonly timeout: number;
  private readonly fetch: TronZapConfig['fetch'];

  constructor(config: TronZapConfig) {
    this.apiToken = config.apiToken;
    this.apiSecret = config.apiSecret;
    if (!this.apiToken || !this.apiSecret) {
      throw new InvalidRequestError('apiToken and apiSecret are required');
    }
    this.baseUrl = (present(config.baseUrl) ? config.baseUrl : DEFAULT_BASE_URL).replace(
      /\/+$/,
      ''
    );
    if (this.baseUrl === '') {
      throw new InvalidRequestError('baseUrl is required');
    }
    this.timeout = timeoutOf(config.timeout, DEFAULT_TIMEOUT);
    this.fetch = config.fetch;
  }

  async request(
    endpoint: string,
    data: Params = {},
    options: RequestOptions = {}
  ): Promise<ApiResult> {
    if (!endpoint.startsWith('/')) {
      throw new InvalidRequestError('endpoint must start with /');
    }
    const timeout = timeoutOf(options.timeout, this.timeout);
    let body: string;
    try {
      body = JSON.stringify(data);
    } catch (error) {
      throw new InvalidRequestError('params cannot be encoded as JSON', { cause: error });
    }
    options.signal?.throwIfAborted();

    const timeoutSignal = AbortSignal.timeout(timeout);
    const signal = options.signal
      ? AbortSignal.any([options.signal, timeoutSignal])
      : timeoutSignal;
    const init: RequestInit = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        'X-Signature': createHash('sha256')
          .update(body + this.apiSecret)
          .digest('hex'),
      },
      body,
      signal,
    };

    let status: number;
    let ok: boolean;
    let text: string;
    try {
      const response = await (this.fetch ?? fetch)(this.baseUrl + endpoint, init);
      ({ status, ok } = response);
      text = await response.text();
    } catch (error) {
      if (options.signal?.aborted) {
        throw options.signal.reason;
      }
      if (timeoutSignal.aborted) {
        throw new TimeoutError(`Request timed out after ${String(timeout)} ms`, error as Error);
      }
      throw networkError(error);
    }

    const parsed = parseJson(text);
    if (parsed !== null && !(isObject(parsed.value) && parsed.value.code === 0)) {
      throw apiError(parsed.value, status);
    }
    if (!ok) {
      throw httpError(status, text);
    }
    if (parsed === null) {
      throw new ServerError(status, 'Invalid JSON response', text);
    }
    const { result } = parsed.value as Params;
    if (typeof result !== 'object' || result === null) {
      throw new ServerError(status, 'Missing or invalid result in response', text);
    }
    return result;
  }

  async getServices(options?: RequestOptions): Promise<ApiResult> {
    return this.request('/v1/services', {}, options);
  }

  async getBalance(options?: RequestOptions): Promise<ApiResult> {
    return this.request('/v1/balance', {}, options);
  }

  async getAddressInfo(address: string, options?: RequestOptions): Promise<ApiResult> {
    return this.request('/v1/address-info', { address: required('address', address) }, options);
  }

  /** Without `contractAddress`, the API estimates a USDT (TRC20) transfer. */
  async estimateEnergy(
    fromAddress: string,
    toAddress: string,
    contractAddress?: string,
    options?: RequestOptions
  ): Promise<ApiResult> {
    const data: Params = {
      from_address: required('fromAddress', fromAddress),
      to_address: required('toAddress', toAddress),
    };
    if (present(contractAddress)) {
      data.contract_address = contractAddress;
    }
    return this.request('/v1/estimate-energy', data, options);
  }

  async calculate(
    address: string,
    energy: number,
    duration = 1,
    options?: RequestOptions
  ): Promise<ApiResult> {
    const data = {
      address: required('address', address),
      amount: energy,
      duration: atLeast(duration, 1, 1),
    };
    return this.request('/v1/calculate', data, options);
  }

  /** `duration` is in hours, one of the durations `getServices()` lists. */
  async createEnergyTransaction(
    address: string,
    energyAmount: number,
    duration = 1,
    externalId?: string,
    activateAddress = false,
    options?: RequestOptions
  ): Promise<ApiResult> {
    return this.createTransaction(
      'energy',
      address,
      { energy: energyAmount },
      duration,
      externalId,
      activateAddress,
      options
    );
  }

  async createBandwidthTransaction(
    address: string,
    amount: number,
    externalId?: string,
    options?: RequestOptions
  ): Promise<ApiResult> {
    return this.createTransaction(
      'bandwidth',
      address,
      { bandwidth: amount },
      1,
      externalId,
      false,
      options
    );
  }

  /** Buys energy and bandwidth in one transaction. */
  async createResourceBundleTransaction(
    address: string,
    energyAmount: number,
    bandwidthAmount: number,
    duration = 1,
    externalId?: string,
    activateAddress = false,
    options?: RequestOptions
  ): Promise<ApiResult> {
    return this.createTransaction(
      'resource_bundle',
      address,
      { energy: energyAmount, bandwidth: bandwidthAmount },
      duration,
      externalId,
      activateAddress,
      options
    );
  }

  async createAddressActivationTransaction(
    address: string,
    externalId?: string,
    options?: RequestOptions
  ): Promise<ApiResult> {
    const data = this.withExternalId(
      { service: 'activate_address', params: { address: required('address', address) } },
      externalId
    );
    return this.request('/v1/transaction/new', data, options);
  }

  /** `type` is `address` or `hash`; `hash` and `direction` apply to a hash check. */
  async createAmlCheck(
    type: string,
    network: string,
    address: string,
    hash?: string,
    direction?: string,
    options?: RequestOptions
  ): Promise<ApiResult> {
    const data: Params = {
      type: required('type', type),
      network: required('network', network),
      address: required('address', address),
    };
    if (present(hash)) {
      data.hash = hash;
    }
    if (present(direction)) {
      data.direction = direction;
    }
    return this.request('/v1/aml-checks/new', data, options);
  }

  /** Takes the transaction `id`, its `externalId`, or both. */
  async checkTransaction(
    id?: string,
    externalId?: string,
    options?: RequestOptions
  ): Promise<ApiResult> {
    return this.requestById('/v1/transaction/check', id, externalId, options);
  }

  async checkAmlStatus(id: string, options?: RequestOptions): Promise<ApiResult> {
    return this.request('/v1/aml-checks/check', { id: required('id', id) }, options);
  }

  async getAmlServices(options?: RequestOptions): Promise<ApiResult> {
    return this.request('/v1/aml-checks', {}, options);
  }

  async getAmlHistory(
    page = 1,
    perPage = 10,
    status?: string,
    options?: RequestOptions
  ): Promise<ApiResult> {
    const data: Params = { page: atLeast(page, 1, 1), per_page: atLeast(perPage, 1, 10) };
    if (present(status)) {
      data.status = status;
    }
    return this.request('/v1/aml-checks/history', data, options);
  }

  async getDirectRechargeInfo(options?: RequestOptions): Promise<ApiResult> {
    return this.request('/v1/direct-recharge-info', {}, options);
  }

  /**
   * Subscription plans on sale, keyed by the plan's subscription id such as `unlimited_energy`, in the API's order.
   * Pass that key, not the plan's numeric `id`, to `startSubscription`.
   */
  async getSubscriptions(options?: RequestOptions): Promise<Record<string, ApiResult>> {
    const plans: unknown = await this.request('/v1/subscriptions', {}, options);
    // The API encodes an empty plan list as [].
    return Array.isArray(plans) && plans.length === 0 ? {} : (plans as Record<string, ApiResult>);
  }

  /**
   * Subscribes `address` to the plan `subscriptionId`, a key of `getSubscriptions()`. `durationDays` and
   * `transactionsLimit` are 0 for no limit. Starting a subscription charges the plan's initial price.
   */
  async startSubscription(
    subscriptionId: string,
    address: string,
    durationDays = 0,
    transactionsLimit = 0,
    externalId?: string,
    activateAddress = false,
    options?: RequestOptions
  ): Promise<ApiResult> {
    const params: Params = {
      address: required('address', address),
      duration: notNegative('durationDays', durationDays),
      transactions_limit: notNegative('transactionsLimit', transactionsLimit),
    };
    if (activateAddress) {
      params.activate_address = true;
    }
    const data = this.withExternalId(
      { subscription_id: required('subscriptionId', subscriptionId), params },
      externalId
    );
    return this.request('/v1/subscription/start', data, options);
  }

  /** Takes the subscription `id`, its `externalId`, or both. */
  async checkSubscription(
    id?: string,
    externalId?: string,
    options?: RequestOptions
  ): Promise<ApiResult> {
    return this.requestById('/v1/subscription/check', id, externalId, options);
  }

  /**
   * Takes the subscription `id`, its `externalId`, or both. A subscription with a transactions limit cannot be
   * stopped and fails with `ErrorCode.CANNOT_STOP_SUBSCRIPTION`.
   */
  async stopSubscription(
    id?: string,
    externalId?: string,
    options?: RequestOptions
  ): Promise<ApiResult> {
    return this.requestById('/v1/subscription/stop', id, externalId, options);
  }

  /** Items carry the usage counters `transactions_used`, `energy_used` and `total_price` instead of `params`. */
  async getSubscriptionHistory(
    page = 1,
    perPage = 10,
    status?: string,
    options?: RequestOptions
  ): Promise<ApiResult> {
    const data: Params = { page: atLeast(page, 1, 1), per_page: atLeast(perPage, 1, 10) };
    if (present(status)) {
      data.status = status;
    }
    return this.request('/v1/subscriptions/history', data, options);
  }

  private async createTransaction(
    service: string,
    address: string,
    amounts: Params,
    duration: number,
    externalId: string | undefined,
    activateAddress: boolean,
    options: RequestOptions | undefined
  ): Promise<ApiResult> {
    const params: Params = {
      address: required('address', address),
      amounts,
      duration: atLeast(duration, 1, 1),
    };
    if (activateAddress) {
      params.activate_address = true;
    }
    return this.request(
      '/v1/transaction/new',
      this.withExternalId({ service, params }, externalId),
      options
    );
  }

  private async requestById(
    endpoint: string,
    id: string | undefined,
    externalId: string | undefined,
    options: RequestOptions | undefined
  ): Promise<ApiResult> {
    const data: Params = {};
    if (present(id)) {
      data.id = id;
    }
    if (present(externalId)) {
      data.external_id = externalId;
    }
    if (Object.keys(data).length === 0) {
      throw new InvalidRequestError('id or externalId is required');
    }
    return this.request(endpoint, data, options);
  }

  private withExternalId(data: Params, externalId: string | undefined): Params {
    return present(externalId) ? { ...data, external_id: externalId } : data;
  }
}
