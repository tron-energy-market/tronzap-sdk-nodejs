export interface TronZapConfig {
  apiToken: string;
  apiSecret: string;
  baseUrl?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
}

export interface Balance {
  amount: number;
  currency: string;
}

export interface Calculation {
  cost: number;
  currency: string;
  energy: number;
}

export interface Transaction {
  transaction_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  address: string;
  energy_amount: number;
  duration: number;
  cost: number;
  currency: string;
}

export interface DirectRechargeInfo {
  address: string;
  network: string;
  currency: string;
  min_amount: number;
  max_amount: number;
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
  INTERNAL_SERVER_ERROR = 500
}

export class TronZapError extends Error {
  constructor(
    public code: ErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'TronZapError';
  }
}