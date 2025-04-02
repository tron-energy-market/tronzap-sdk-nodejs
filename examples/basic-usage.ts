import { TronZapClient } from '../dist/index.js';

async function main() {
  // Initialize the client
  const client = new TronZapClient({
    apiToken: process.env.TRONZAP_API_TOKEN || 'your_api_token',
    apiSecret: process.env.TRONZAP_API_SECRET || 'your_api_secret'
  });

  try {
    // Get available services
    console.log('Fetching available services...');
    const services = await client.getServices();
    console.log('Available services:', services);

    // Get account balance
    console.log('\nFetching account balance...');
    const balance = await client.getBalance();
    console.log('Account balance:', balance);

    // Calculate energy cost for a TRON address
    const address = 'TRON_WALLET_ADDRESS'; // Replace with actual TRON address
    console.log('\nCalculating energy cost...');
    const calculation = await client.calculate(address, 65150);
    console.log('Energy cost calculation:', calculation);

    // Create an energy transaction
    console.log('\nCreating energy transaction...');
    const transaction = await client.createEnergyTransaction(
      address,
      65150,
      1,
      'example-tx-' + Date.now(),
      true
    );
    console.log('Created transaction:', transaction);

    // Check transaction status
    console.log('\nChecking transaction status...');
    const status = await client.checkTransaction(transaction.transaction_id);
    console.log('Transaction status:', status);

    // Get direct recharge information
    console.log('\nFetching direct recharge information...');
    const rechargeInfo = await client.getDirectRechargeInfo();
    console.log('Direct recharge info:', rechargeInfo);

  } catch (error) {
    console.error('Error:', error);
  }
}

main();