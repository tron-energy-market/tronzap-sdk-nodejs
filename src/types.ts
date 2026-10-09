export interface TronZapConfig {
  apiToken: string;
  apiSecret: string;
  baseUrl?: string;
  /** Milliseconds per request, including reading the response. 30000 by default. */
  timeout?: number;
  /** Replaces the global `fetch`, e.g. to go through a proxy or trust another certificate authority. */
  fetch?: (input: string, init: RequestInit) => Promise<Response>;
}

export interface RequestOptions {
  /** Aborting it rejects the call with the signal's reason. */
  signal?: AbortSignal;
  /** Milliseconds, overrides the client's timeout for this call. */
  timeout?: number;
}

// Results are not typed yet: narrowing `any` would break callers that read fields TypeScript does not know about.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiResult = any;

export enum ErrorCode {
  AUTH_ERROR = 1,
  INVALID_SERVICE_OR_PARAMS = 2,
  WALLET_NOT_FOUND = 5,
  INSUFFICIENT_FUNDS = 6,
  /** Invalid TRON address, or the address already has an active subscription. */
  INVALID_TRON_ADDRESS = 10,
  INVALID_ENERGY_AMOUNT = 11,
  INVALID_DURATION = 12,
  /** The API reports it with the key `subscription_not_found`. */
  TRANSACTION_NOT_FOUND = 20,
  /** Cannot stop subscription, e.g. it has a transactions limit. */
  CANNOT_STOP_SUBSCRIPTION = 21,
  ADDRESS_NOT_ACTIVATED = 24,
  ADDRESS_ALREADY_ACTIVATED = 25,
  AML_CHECK_NOT_FOUND = 30,
  SERVICE_NOT_AVAILABLE = 35,
  INVALID_BANDWIDTH_AMOUNT = 50,
  INTERNAL_SERVER_ERROR = 500,
  UNKNOWN_ERROR = 999,
}

export class TronZapError extends Error {
  constructor(
    public code: number,
    message: string
  ) {
    super(message);
    this.name = 'TronZapError';
  }
}

/** The API answered with a non-zero `code`, whatever the HTTP status. */
export class ApiError extends TronZapError {
  public readonly errorKey: string | null;
  public readonly requestId: string | null;
  public readonly statusCode: number;

  constructor(
    code: number,
    message: string,
    errorKey: string | null = null,
    requestId: string | null = null,
    statusCode = 0
  ) {
    super(code, message);
    this.name = 'ApiError';
    this.errorKey = errorKey;
    this.requestId = requestId;
    this.statusCode = statusCode;
  }
}

/** Thrown before sending when an argument or the configuration is invalid. */
export class InvalidRequestError extends TronZapError {
  constructor(message: string, options?: ErrorOptions) {
    super(0, message);
    this.name = 'InvalidRequestError';
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export class NetworkError extends TronZapError {
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(0, message);
    this.name = 'NetworkError';
    this.originalError = originalError;
  }
}

export class ConnectionError extends NetworkError {
  constructor(message: string, originalError?: Error) {
    super(message, originalError);
    this.name = 'ConnectionError';
  }
}

export class TimeoutError extends NetworkError {
  constructor(message: string, originalError?: Error) {
    super(message, originalError);
    this.name = 'TimeoutError';
  }
}

export class SslError extends NetworkError {
  constructor(message: string, originalError?: Error) {
    super(message, originalError);
    this.name = 'SslError';
  }
}

export class HttpError extends TronZapError {
  public readonly responseBody: string;

  constructor(statusCode: number, message: string, responseBody = '') {
    super(statusCode, message);
    this.name = 'HttpError';
    this.responseBody = responseBody;
  }

  get statusCode(): number {
    return this.code;
  }
}

export class ServerError extends HttpError {
  constructor(statusCode: number, message: string, responseBody?: string) {
    super(statusCode, message, responseBody);
    this.name = 'ServerError';
  }
}

export class RateLimitError extends HttpError {
  constructor(message: string, responseBody?: string) {
    super(429, message, responseBody);
    this.name = 'RateLimitError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(statusCode: number, message: string, responseBody?: string) {
    super(statusCode, message, responseBody);
    this.name = 'UnauthorizedError';
  }
}
