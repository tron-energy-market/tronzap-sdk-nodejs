export interface TronZapConfig {
  apiToken: string;
  apiSecret: string;
  baseUrl?: string;
}

export enum ErrorCode {
  AUTH_ERROR = 1,
  INVALID_SERVICE_OR_PARAMS = 2,
  WALLET_NOT_FOUND = 5,
  INSUFFICIENT_FUNDS = 6,
  INVALID_TRON_ADDRESS = 10,
  INVALID_ENERGY_AMOUNT = 11,
  INVALID_DURATION = 12,
  TRANSACTION_NOT_FOUND = 20,
  CANNOT_STOP_SUBSCRIPTION = 21,
  ADDRESS_NOT_ACTIVATED = 24,
  ADDRESS_ALREADY_ACTIVATED = 25,
  AML_CHECK_NOT_FOUND = 30,
  SERVICE_NOT_AVAILABLE = 35,
  INVALID_BANDWIDTH_AMOUNT = 50,
  INTERNAL_SERVER_ERROR = 500,
  UNKNOWN_ERROR = 999,
}

// Base error — backward-compatible
export class TronZapError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = 'TronZapError';
  }
}

// API-level errors (response body code != 0)
export class ApiError extends TronZapError {
  public readonly errorKey: string | null;

  constructor(code: number, message: string, errorKey: string | null = null) {
    super(code, message);
    this.name = 'ApiError';
    this.errorKey = errorKey;
  }
}

// Network-level errors (fetch threw before a response was received)
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

// HTTP-level errors (non-2xx response)
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
