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
  ADDRESS_NOT_ACTIVATED = 24,
  ADDRESS_ALREADY_ACTIVATED = 25,
  INTERNAL_SERVER_ERROR = 500,
  UNKNOWN_ERROR = 999, // Added for fallback
}

export class TronZapError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = 'TronZapError';
  }
}