import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TronZapClient } from '../src/client';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TronZapClient', () => {
  let client: TronZapClient;

  beforeEach(() => {
    client = new TronZapClient({
      apiToken: 'your-api-token',
      apiSecret: 'your-api-secret'
    });
    vi.clearAllMocks();
  });

  describe('getServices', () => {
    it('should return services list', async () => {
      const mockResponse = {
        data: {
          energy: [
            {
              duration: 1,
              min_energy: 32000,
              max_energy: 131000,
              price: 0.0569,
              price_32k: 1.82,
              price_65k: 3.7,
              price_131k: 7.45
            },
            {
              duration: 1,
              min_energy: 131000,
              max_energy: 4000000,
              price: 0.0534,
              price_32k: 1.71,
              price_65k: 3.47,
              price_131k: 7
            },
            {
              duration: 24,
              min_energy: 32000,
              max_energy: 131000,
              price: 0.13,
              price_32k: 4.16,
              price_65k: 8.45,
              price_131k: 17.03
            },
            {
              duration: 24,
              min_energy: 131000,
              max_energy: 5000000,
              price: 0.1145,
              price_32k: 3.66,
              price_65k: 7.44,
              price_131k: 15
            }
          ],
          activate_address: {
            price: 1.4
          }
        }
      };

      mockedAxios.create.mockReturnValue({
        get: vi.fn().mockResolvedValue(mockResponse)
      } as any);

      const result = await client.getServices();
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getBalance', () => {
    it('should return account balance', async () => {
      const mockResponse = {
        data: {
          amount: 100.0,
          address: 'TRON_WALLET_ADDRESS'
        }
      };

      mockedAxios.create.mockReturnValue({
        get: vi.fn().mockResolvedValue(mockResponse)
      } as any);

      const result = await client.getBalance();
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('estimateEnergy', () => {
    it('should estimate energy cost', async () => {
      const mockResponse = {
        data: {
          energy: 64400,
          duration: 1,
          price: 3.66,
          activation_fee: 0,
          total: 3.66,
          contract_address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
          from_address: 'TRON_WALLET_ADDRESS',
          to_address: 'TRON_WALLET_ADDRESS'
        }
      };

      mockedAxios.create.mockReturnValue({
        post: vi.fn().mockResolvedValue(mockResponse)
      } as any);

      const result = await client.estimateEnergy('test_address', 'test_address', 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('calculate', () => {
    it('should calculate energy cost', async () => {
      const mockResponse = {
        data: {
          address: "TRX_ADDRESS",
          energy: 32000,
          duration: 1,
          price: 1.67,
          activation_fee: 0,
          total: 1.67
        }
      };

      mockedAxios.create.mockReturnValue({
        post: vi.fn().mockResolvedValue(mockResponse)
      } as any);

      const result = await client.calculate('test_address', 131000);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('createEnergyTransaction', () => {
    it('should create energy transaction', async () => {
      const mockResponse = {
        data: {
          id: "transaction_id",
          external_id: "my-external-id-123",
          params: {
            address: "TRX_ADDRESS",
            energy_amount: 32000,
            duration: 1
          },
          status: "pending",
          amount: 1.67,
          created_at: "2024-03-22T12:00:00Z",
          hash: "transaction_hash"
        }
      };

      mockedAxios.create.mockReturnValue({
        post: vi.fn().mockResolvedValue(mockResponse)
      } as any);

      const result = await client.createEnergyTransaction(
        'test_address',
        32000,
        1,
        'test_tx_id',
        true
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('checkTransaction', () => {
    it('should check transaction status', async () => {
      const mockResponse = {
        data: {
          id: "transaction_id",
          external_id: "my-external-id-123",
          params: {
            address: "TRX_ADDRESS",
            energy_amount: 32000,
            duration: 1
          },
          status: "success",
          amount: 1.67,
          created_at: "2024-03-22T12:00:00Z",
          hash: "transaction_hash"
        }
      };

      mockedAxios.create.mockReturnValue({
        get: vi.fn().mockResolvedValue(mockResponse)
      } as any);

      const result = await client.checkTransaction('test_tx_id');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getDirectRechargeInfo', () => {
    it('should return direct recharge information', async () => {
      const mockResponse = {
        data: {
          address: "TRONZAP_PUBLIC_TRX_ADDRESS",
          rates: [
            {
              duration: 1,
              min_energy: 32000,
              max_energy: 131000,
              price: 0.0569,
              price_32k: 1.82,
              price_65k: 3.7,
              price_131k: 7.45
            },
            {
              duration: 1,
              min_energy: 131000,
              max_energy: 4000000,
              price: 0.0534,
              price_32k: 1.71,
              price_65k: 3.47,
              price_131k: 7
            }
          ]
        }
      };

      mockedAxios.create.mockReturnValue({
        get: vi.fn().mockResolvedValue(mockResponse)
      } as any);

      const result = await client.getDirectRechargeInfo();
      expect(result).toEqual(mockResponse.data);
    });
  });
});