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

    // Estimate energy cost for a TRON address
    console.log('\nEstimating energy cost...');
    const fromAddress = 'TRON_WALLET_ADDRESS';
    const toAddress = 'TRON_WALLET_ADDRESS';
    const contractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // e.g. USDT TRC20
    const energyEstimate = await client.estimateEnergy(fromAddress, toAddress, contractAddress);
    console.log('Energy estimate:', energyEstimate);

    // Calculate energy cost for a TRON address
    console.log('\nCalculating energy cost...');

    const address = 'TRON_WALLET_ADDRESS'; // Replace with actual TRON address
    const energyAmount = 65150; // From 32000
    const duration = 1; // Possible values: 1 or 24 hours

    const calculation = await client.calculate(address, energyAmount);
    console.log('Energy cost calculation:', calculation);

    // Create an energy transaction
    console.log('\nCreating energy transaction...');
    const transaction = await client.createEnergyTransaction(
      address,
      energyAmount,
      duration,
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