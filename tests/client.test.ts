import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TronZapClient } from '../src/client';
import { TronZapError } from '../src/types';

describe('TronZapClient', () => {
  const apiToken = 'your-api-token';
  const apiSecret = 'your-api-secret';
  let client: TronZapClient;
  const fetchMock = vi.fn();

  beforeEach(() => {
    client = new TronZapClient({ apiToken, apiSecret });
    fetchMock.mockReset();
    global.fetch = fetchMock as any;
  });

  const mockResponse = (result: any, code = 0) => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ code, result })
    });
  };

  it('fetches services', async () => {
    mockResponse([{ id: 'service' }]);
    const result = await client.getServices();
    expect(result).toEqual([{ id: 'service' }]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.tronzap.com/v1/services',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('creates energy transaction with amount alias', async () => {
    mockResponse({ id: 'tx' });
    await client.createEnergyTransaction('TRX', 32000, 1, 'ext', true);

    const [, request] = fetchMock.mock.calls[0];
    const body = JSON.parse((request as RequestInit).body as string);
    expect(body).toMatchObject({
      service: 'energy',
      params: {
        address: 'TRX',
        energy_amount: 32000,
        amount: 32000,
        duration: 1,
        activate_address: true
      },
      external_id: 'ext'
    });
  });

  it('creates bandwidth transaction', async () => {
    mockResponse({ id: 'bandwidth' });
    await client.createBandwidthTransaction('TRX', 1000, 'bw-1');

    const [, request] = fetchMock.mock.calls[0];
    const body = JSON.parse((request as RequestInit).body as string);
    expect(body).toEqual({
      service: 'bandwidth',
      params: {
        address: 'TRX',
        amount: 1000,
        duration: 1
      },
      external_id: 'bw-1'
    });
  });

  it('creates AML check', async () => {
    mockResponse({ id: 'aml' });
    await client.createAmlCheck('address', 'TRX', 'ADDR');

    const [, request] = fetchMock.mock.calls[0];
    const body = JSON.parse((request as RequestInit).body as string);
    expect(body).toEqual({
      type: 'address',
      network: 'TRX',
      address: 'ADDR'
    });
  });

  it('fetches AML history with filters', async () => {
    mockResponse({ items: [] });
    await client.getAmlHistory(2, 5, 'completed');

    const [, request] = fetchMock.mock.calls[0];
    const body = JSON.parse((request as RequestInit).body as string);
    expect(body).toEqual({
      page: 2,
      per_page: 5,
      status: 'completed'
    });
  });

  it('throws error on API failure', async () => {
    mockResponse(null, 2);
    await expect(client.getBalance()).rejects.toBeInstanceOf(TronZapError);
  });

  it('requires id or externalId in checkTransaction', async () => {
    await expect(client.checkTransaction()).rejects.toBeInstanceOf(TronZapError);
  });
});
