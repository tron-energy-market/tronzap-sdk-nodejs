import crypto from 'crypto';
import {
  TronZapConfig,
  Service,
  Balance,
  Calculation,
  Transaction,
  DirectRechargeInfo,
  TronZapError
} from './types';

export class TronZapClient {
  private readonly baseUrl: string;
  private readonly apiToken: string;
  private readonly apiSecret: string;

  constructor(config: TronZapConfig) {
    this.baseUrl = config.baseUrl || 'https://api.tronzap.com';
    this.apiToken = config.apiToken;
    this.apiSecret = config.apiSecret;
  }

  private async request<T>(endpoint: string, data?: Record<string, any>): Promise<T> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    };

    if (!data) {
      data = {};
    }

    const stringifiedData = JSON.stringify(data);
    headers['X-Signature'] = crypto.createHash('sha256').update(stringifiedData + this.apiSecret).digest('hex');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: stringifiedData
    });

    const responseData = await response.json() as { code: number; result: T };

    if (!response.ok || responseData.code !== 0) {
      throw new TronZapError(responseData.code || 500, 'Request failed');
    }

    return responseData.result;
  }

  async getServices(): Promise<Service[]> {
    return this.request<Service[]>('/v1/services');
  }

  async getBalance(): Promise<Balance> {
    return this.request<Balance>('/v1/balance');
  }

  async calculate(address: string, energy: number): Promise<Calculation> {
    const data = { address, energy };
    return this.request<Calculation>('/v1/calculate', data);
  }

  async createEnergyTransaction(
    address: string,
    energyAmount: number,
    duration: number,
    externalId?: string,
    activateAddress: boolean = false
  ): Promise<Transaction> {
    const data = {
      address,
      energy_amount: energyAmount,
      duration,
      external_id: externalId,
      activate_address: activateAddress
    };
    return this.request<Transaction>('/v1/transactions/energy', data);
  }

  async createAddressActivationTransaction(
    address: string,
    externalId?: string
  ): Promise<Transaction> {
    const data = {
      address,
      external_id: externalId
    };
    return this.request<Transaction>('/v1/transactions/activate', data);
  }

  async checkTransaction(transactionId: string): Promise<Transaction> {
    return this.request<Transaction>(`/v1/transactions/${transactionId}`);
  }

  async getDirectRechargeInfo(): Promise<DirectRechargeInfo> {
    return this.request<DirectRechargeInfo>('/v1/direct-recharge');
  }
}