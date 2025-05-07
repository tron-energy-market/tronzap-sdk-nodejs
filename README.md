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

// Check transaction status
const status = await client.checkTransaction('TRANSACTION_ID');
console.log(status);

// Get direct recharge information
const rechargeInfo = await client.getDirectRechargeInfo();
console.log(rechargeInfo);
```

## Features

- Full TypeScript support
- Cross-platform compatibility (Node.js, Bun, Deno)
- Get available services
- Get account balance
- Calculate energy cost
- Create address activation transactions
- Create energy purchase transactions
- Check transaction status
- Get direct recharge information

## Requirements

- Node.js v16.0.0 or higher, or
- Bun v1.0.0 or higher, or
- Deno v1.0.0 or higher

## Error Handling

The SDK throws `TronZapError` when the API returns an error. Each error includes a `.code` and a `.message` property for debugging and handling specific cases.

### Example

```typescript
import { TronZapClient, TronZapError, ErrorCode } from 'tronzap-sdk';

const client = new TronZapClient({
  apiToken: 'your_api_token',
  apiSecret: 'your_api_secret'
});

try {
  const balance = await client.getBalance();
} catch (error) {
  if (error instanceof TronZapError) {
    switch (error.code) {
      case ErrorCode.AUTH_ERROR:
        console.error('Authentication error');
        break;
      case ErrorCode.INVALID_SERVICE_OR_PARAMS:
        console.error('Invalid service or parameters');
        break;
      case ErrorCode.WALLET_NOT_FOUND:
        console.error('Internal wallet not found. Contact support.');
        break;
      case ErrorCode.INSUFFICIENT_FUNDS:
        console.error('Insufficient funds');
        break;
      case ErrorCode.INVALID_TRON_ADDRESS:
        console.error('Invalid TRON address');
        break;
      case ErrorCode.INVALID_ENERGY_AMOUNT:
        console.error('Invalid energy amount');
        break;
      case ErrorCode.INVALID_DURATION:
        console.error('Invalid duration');
        break;
      case ErrorCode.TRANSACTION_NOT_FOUND:
        console.error('Transaction not found');
        break;
      case ErrorCode.ADDRESS_NOT_ACTIVATED:
        console.error('Address not activated');
        break;
      case ErrorCode.ADDRESS_ALREADY_ACTIVATED:
        console.error('Address already activated');
        break;
      case ErrorCode.INTERNAL_SERVER_ERROR:
        console.error('Internal server error');
        break;
      default:
        console.error(`Unhandled error ${error.code}: ${error.message}`);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Error Codes

| Code | Constant                        | Description |
|------|----------------------------------|-------------|
| 1    | `AUTH_ERROR`                    | Authentication error – Invalid API token or signature |
| 2    | `INVALID_SERVICE_OR_PARAMS`    | Invalid service or parameters |
| 5    | `WALLET_NOT_FOUND`             | Internal wallet not found. Contact support. |
| 6    | `INSUFFICIENT_FUNDS`           | Insufficient funds |
| 10   | `INVALID_TRON_ADDRESS`         | Invalid TRON address |
| 11   | `INVALID_ENERGY_AMOUNT`        | Invalid energy amount |
| 12   | `INVALID_DURATION`             | Invalid duration |
| 20   | `TRANSACTION_NOT_FOUND`        | Transaction not found |
| 24   | `ADDRESS_NOT_ACTIVATED`        | Address not activated |
| 25   | `ADDRESS_ALREADY_ACTIVATED`    | Address already activated |
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