# TronZap SDK for Node.js

**[English](README.md)** | [Español](README.es.md) | [Português](README.pt-br.md) | [Русский](README.ru.md)

Official Node.js SDK for the TronZap API.
This SDK allows you to easily integrate with TronZap services for TRON energy rental.

TronZap.com allows you to [buy TRON energy](https://tronzap.com/), making USDT (TRC20) transfers cheaper by significantly reducing transaction fees.

👉 [Register for an API key](https://tronzap.com) to start using Tron Energy API and integrate it via the SDK.

## Installation

```bash
npm install tronzap-sdk
# or
yarn add tronzap-sdk
# or
pnpm add tronzap-sdk
```

Check out at npm: https://www.npmjs.com/package/tronzap-sdk

## Platform Support

This SDK is designed to work across multiple JavaScript/TypeScript platforms:

- **Node.js**: v16.0.0 or higher
- **Bun**: v1.0.0 or higher
- **Deno**: v1.0.0 or higher

## Quick Start

```typescript
import { TronZapClient } from 'tronzap-sdk';

// Initialize the client
const client = new TronZapClient({
  apiToken: 'your_api_token',
  apiSecret: 'your_api_secret'
});

// Get available services
const services = await client.getServices();
console.log(services);

// Get account balance
const balance = await client.getBalance();
console.log(balance);

// Get address info (resources and balances)
const addressInfo = await client.getAddressInfo('TRX_ADDRESS');
console.log(addressInfo);

// Estimate energy amount for USDT transfer
const estimate = await client.estimateEnergy(
  'FROM_TRX_ADDRESS',
  'TO_TRX_ADDRESS',
  'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' // USDT contract address
);
console.log(estimate);

// Calculate energy cost
const calculation = await client.calculate(
  'TRON_WALLET_ADDRESS',
  65150  // Recommended amount for USDT transfers
);
console.log(calculation);

// Create energy transaction
const transaction = await client.createEnergyTransaction(
  'TRON_WALLET_ADDRESS',
  65150, // From 60000
  1, // Possible values: 1 or 24 hours
  'my-tx-id',  // Optional external ID
  true        // Optional: activate address if needed
);
console.log(transaction);

// Buy bandwidth
const bandwidth = await client.createBandwidthTransaction(
  'TRON_WALLET_ADDRESS',
  1000,
  'bandwidth-1'
);
console.log(bandwidth);

// Buy a resource bundle (energy + bandwidth in one transaction)
const bundle = await client.createResourceBundleTransaction(
  'TRON_WALLET_ADDRESS',
  65000, // energy amount
  350,   // bandwidth amount
  1,     // duration (hours)
  'bundle-1', // optional external ID
  true        // optional: activate address
);
console.log(bundle);

// Check transaction status
const status = await client.checkTransaction('TRANSACTION_ID');
console.log(status);

// Create AML check
const amlCheck = await client.createAmlCheck(
  'address',
  'TRX',
  'TXYZ1234567890EXAMPLEADDRESS'
);
console.log(amlCheck);

// Check AML status
const amlStatus = await client.checkAmlStatus(amlCheck.id);
console.log(amlStatus);

// Get direct recharge information
const rechargeInfo = await client.getDirectRechargeInfo();
console.log(rechargeInfo);
```

## Features

- Full TypeScript support
- Cross-platform compatibility (Node.js, Bun, Deno)
- Get available services
- Get AML services
- Get account balance
- Get address info (resources and balances)
- Calculate energy cost
- Create address activation transactions
- Create energy purchase transactions
- Create bandwidth purchase transactions
- Create resource bundle transactions (energy + bandwidth in one purchase)
- Create and track AML checks
- Check transaction status
- Get direct recharge information

## Requirements

- Node.js v16.0.0 or higher, or
- Bun v1.0.0 or higher, or
- Deno v1.0.0 or higher

## Error Handling

The SDK uses a hierarchy of error classes for precise error handling:

```
TronZapError
├── ApiError             — API-level errors (response code != 0)
├── NetworkError         — Network/connectivity errors
│   ├── ConnectionError  — Could not connect to server
│   ├── TimeoutError     — Request timed out
│   └── SslError         — SSL/TLS errors
└── HttpError            — HTTP non-2xx responses
    ├── RateLimitError   — HTTP 429 Too Many Requests
    ├── UnauthorizedError — HTTP 401/403
    └── ServerError      — HTTP 5xx errors
```

### Example

```typescript
import {
  TronZapClient,
  ApiError,
  HttpError,
  NetworkError,
  RateLimitError,
  ServerError,
  SslError,
  TimeoutError,
  TronZapError,
  UnauthorizedError,
  ErrorCode,
} from 'tronzap-sdk';

const client = new TronZapClient({
  apiToken: 'your_api_token',
  apiSecret: 'your_api_secret',
});

try {
  const transaction = await client.createEnergyTransaction('TRX_ADDRESS', 65000, 1);
} catch (error) {
  if (error instanceof ApiError) {
    // API-level error (invalid params, insufficient funds, etc.)
    console.error(`API error [${error.code}]: ${error.message}`);

    // Error key alias, e.g. "invalid_tron_address" or "invalid_tron_address.from_address"
    if (error.errorKey) {
      console.error(`Error key: ${error.errorKey}`);
    }

    if (error.code === ErrorCode.INVALID_TRON_ADDRESS) {
      console.error('Check the TRON address format.');
    }
  } else if (error instanceof RateLimitError) {
    console.error('Too many requests, please slow down.');
  } else if (error instanceof UnauthorizedError) {
    console.error('Invalid API token or signature.');
  } else if (error instanceof ServerError) {
    console.error(`TronZap server error [${error.statusCode}].`);
  } else if (error instanceof HttpError) {
    console.error(`HTTP error [${error.statusCode}]: ${error.message}`);
  } else if (error instanceof TimeoutError) {
    console.error('Request timed out.');
  } else if (error instanceof SslError) {
    console.error(`SSL error: ${error.message}`);
  } else if (error instanceof NetworkError) {
    console.error(`Network error: ${error.message}`);
  } else if (error instanceof TronZapError) {
    console.error(`Error [${error.code}]: ${error.message}`);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### API Error Codes

| Code | Constant                        | Description |
|------|----------------------------------|-------------|
| 1    | `AUTH_ERROR`                    | Authentication error – Invalid API token or signature |
| 2    | `INVALID_SERVICE_OR_PARAMS`    | Invalid service or parameters |
| 5    | `WALLET_NOT_FOUND`             | Internal wallet not found. Contact support. |
| 6    | `INSUFFICIENT_FUNDS`           | Insufficient funds |
| 10   | `INVALID_TRON_ADDRESS`         | Invalid TRON address |
| 11   | `INVALID_ENERGY_AMOUNT`        | Invalid energy amount |
| 12   | `INVALID_DURATION`             | Invalid duration |
| 20   | `TRANSACTION_NOT_FOUND`        | Transaction/subscription not found |
| 21   | `CANNOT_STOP_SUBSCRIPTION`     | Cannot stop subscription |
| 24   | `ADDRESS_NOT_ACTIVATED`        | Address not activated |
| 25   | `ADDRESS_ALREADY_ACTIVATED`    | Address already activated |
| 30   | `AML_CHECK_NOT_FOUND`          | AML check not found |
| 35   | `SERVICE_NOT_AVAILABLE`        | Service not available |
| 50   | `INVALID_BANDWIDTH_AMOUNT`     | Invalid bandwidth amount |
| 500  | `INTERNAL_SERVER_ERROR`        | Internal server error – Contact support |

## Development

```bash
# Install dependencies
npm install

# Build the SDK
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Support

For support, please contact us on Telegram: [@tronzap_bot](https://t.me/tronzap_bot)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
