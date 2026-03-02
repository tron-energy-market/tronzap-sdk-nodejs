import crypto from 'crypto';
import {
  ApiError,
  ConnectionError,
  ErrorCode,
  HttpError,
  NetworkError,
  RateLimitError,
  ServerError,
  SslError,
  TimeoutError,
  TronZapConfig,
  UnauthorizedError,
} from './types';

function buildNetworkError(error: Error): NetworkError {
  const cause = (error as { cause?: { code?: string; message?: string } }).cause;
  const causeCode = cause?.code ?? '';
  const causeMessage = (cause?.message ?? error.message).toLowerCase();

  if (['ECONNREFUSED', 'ENOTFOUND', 'ECONNRESET'].includes(causeCode)) {
    return new ConnectionError(error.message, error);
  }
  if (['ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT'].includes(causeCode) || causeMessage.includes('timeout')) {
    return new TimeoutError(error.message, error);
  }
  if (causeMessage.includes('certificate') || causeMessage.includes('ssl') || causeMessage.includes('self signed')) {
    return new SslError(error.message, error);
  }
  return new NetworkError(error.message, error);
}

function buildHttpError(status: number, body: string): HttpError {
  if (status === 429) {
    return new RateLimitError('Too many requests', body);
  }
  if (status === 401 || status === 403) {
    return new UnauthorizedError(status, 'Unauthorized', body);
  }
  if (status >= 500) {
    return new ServerError(status, 'Server error', body);
  }
  return new HttpError(status, `HTTP error ${status}`, body);
}

export class TronZapClient {
  private readonly baseUrl: string;
  private readonly apiToken: string;
  private readonly apiSecret: string;

  constructor(config: TronZapConfig) {
    // Default API URL if not provided, ensure apiToken and apiSecret are set
    this.baseUrl = config.baseUrl || 'https://api.tronzap.com';
    this.apiToken = config.apiToken;
    this.apiSecret = config.apiSecret;
    if (!this.apiToken || !this.apiSecret) {
      throw new Error('apiToken and apiSecret are required');
    }
  }

  // Generic request handler for all API calls
  async request(endpoint: string, data: Record<string, any> = {}): Promise<any> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    };

    // Generate signature for request authentication
    const stringifiedData = JSON.stringify(data);
    headers['X-Signature'] = crypto.createHash('sha256').update(stringifiedData + this.apiSecret).digest('hex');

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: stringifiedData,
      });
    } catch (error) {
      throw buildNetworkError(error as Error);
    }

    // Read body once — avoid double-consumption
    const body = await response.text();

    if (!response.ok) {
      throw buildHttpError(response.status, body);
    }

    let responseData: { code: number; error?: string; key?: string; result: any };
    try {
      responseData = JSON.parse(body) as typeof responseData;
    } catch {
      throw new ServerError(response.status, 'Invalid JSON response', body);
    }

    if (responseData.code !== 0) {
      throw new ApiError(responseData.code ?? 1, responseData.error ?? 'Unknown API error', responseData.key ?? null);
    }

    return responseData.result;
  }

  // Fetch available services, ensure array return
  async getServices(): Promise<any[]> {
    return this.request('/v1/services');
  }

  // Fetch account balance
  async getBalance(): Promise<any> {
    return this.request('/v1/balance');
  }

  // Estimate energy for a transaction
  async estimateEnergy(fromAddress: string, toAddress: string, contractAddress?: string): Promise<any> {
    const data = { from_address: fromAddress, to_address: toAddress, contract_address: contractAddress };
    return this.request('/v1/estimate-energy', data);
  }

  // Calculate energy cost
  async calculate(address: string, energy: number, duration: number = 1): Promise<any> {
    const data = { address, energy, duration };
    return this.request('/v1/calculate', data);
  }

  // Create an energy transaction
  async createEnergyTransaction(
    address: string,
    energyAmount: number,
    duration: number = 1, // 1 or 24 hours
    externalId?: string,
    activateAddress: boolean = false
  ): Promise<any> {
    const data: Record<string, any> = {
      service: 'energy',
      params: {
        address,
        energy_amount: energyAmount,
        amount: energyAmount,
        duration,
      },
    };

    if (activateAddress) {
      data.params.activate_address = true;
    }

    if (externalId) {
      data.external_id = externalId;
    }

    return this.request('/v1/transaction/new', data);
  }

  // Create a bandwidth transaction
  async createBandwidthTransaction(address: string, amount: number, externalId?: string): Promise<any> {
    const data: Record<string, any> = {
      service: 'bandwidth',
      params: {
        address,
        amount,
        duration: 1,
      },
    };

    if (externalId) {
      data.external_id = externalId;
    }

    return this.request('/v1/transaction/new', data);
  }

  // Create an address activation transaction
  async createAddressActivationTransaction(address: string, externalId?: string): Promise<any> {
    const data: Record<string, any> = {
      service: 'activate_address',
      params: {
        address,
      },
    };

    if (externalId) {
      data.external_id = externalId;
    }

    return this.request('/v1/transaction/new', data);
  }

  // Create AML check
  async createAmlCheck(
    type: string,
    network: string,
    address: string,
    hash?: string,
    direction?: string
  ): Promise<any> {
    const data: Record<string, any> = {
      type,
      network,
      address,
    };

    if (hash) {
      data.hash = hash;
    }

    if (direction) {
      data.direction = direction;
    }

    return this.request('/v1/aml-checks/new', data);
  }

  // Check transaction status
  async checkTransaction(id?: string, externalId?: string): Promise<any> {
    const data: Record<string, any> = {};
    if (id) {
      data.id = id;
    }
    if (externalId) {
      data.external_id = externalId;
    }

    // Ensure data is not empty to avoid API rejection
    if (Object.keys(data).length === 0) {
      throw new ApiError(ErrorCode.INVALID_SERVICE_OR_PARAMS, 'Either id or externalId is required');
    }

    return this.request('/v1/transaction/check', data);
  }

  // Check AML status
  async checkAmlStatus(id: string): Promise<any> {
    return this.request('/v1/aml-checks/check', { id });
  }

  // Get AML services
  async getAmlServices(): Promise<any> {
    return this.request('/v1/aml-checks', {});
  }

  // Get AML history
  async getAmlHistory(page: number = 1, perPage: number = 10, status?: string): Promise<any> {
    const data: Record<string, any> = { page, per_page: perPage };
    if (status) {
      data.status = status;
    }
    return this.request('/v1/aml-checks/history', data);
  }

  // Fetch direct recharge info
  async getDirectRechargeInfo(): Promise<any> {
    return this.request('/v1/direct-recharge-info');
  }
}
