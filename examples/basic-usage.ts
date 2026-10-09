/*
 * Walks through the TronZap API operations. By default it only reads and spends nothing.
 *
 *     export TRONZAP_API_TOKEN=your_api_token
 *     export TRONZAP_API_SECRET=your_api_secret
 *     export TRONZAP_BASE_URL=https://api.tronzap.com  # optional, e.g. a dev host
 *     export TRONZAP_ADDRESS=TRON_ADDRESS              # optional
 *     export TRONZAP_FROM_ADDRESS=TRON_ADDRESS         # optional, with TO_ADDRESS
 *     export TRONZAP_TO_ADDRESS=TRON_ADDRESS           # optional, with FROM_ADDRESS
 *     export TRONZAP_TRANSACTION_ID=id                 # optional
 *     export TRONZAP_AML_CHECK_ID=id                   # optional
 *     export TRONZAP_SUBSCRIPTION_ID=id                # optional
 *     npm install
 *     npm run example
 *
 * Setting TRONZAP_ALLOW_PURCHASES=1 additionally exercises the endpoints that create transactions and AML checks.
 * Those DEBIT THE ACCOUNT BALANCE. It is meant for verifying an integration against a development environment, and
 * it also needs TRONZAP_ADDRESS.
 *
 * Setting TRONZAP_SUBSCRIPTION_PLAN=unlimited_energy as well starts a one-day subscription to that plan for
 * TRONZAP_ADDRESS and stops it straight away. Starting one CHARGES THE PLAN'S INITIAL PRICE.
 */

import { ApiError, ErrorCode, TronZapClient, TronZapError } from '../src';

const ENERGY = 65000;
const BANDWIDTH = 345;

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value === '' ? undefined : value;
}

function field(data: unknown, key: string): string {
  const value: unknown =
    typeof data === 'object' && data !== null ? (data as Record<string, unknown>)[key] : undefined;
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : '-';
}

function rows(data: unknown, key: string): unknown[] {
  const value: unknown =
    typeof data === 'object' && data !== null ? (data as Record<string, unknown>)[key] : undefined;
  return Array.isArray(value) ? value.filter(row => typeof row === 'object' && row !== null) : [];
}

function printSubscription(subscription: unknown): void {
  console.log(
    `  ${field(subscription, 'id')} ${field(subscription, 'subscription_id')} ${field(subscription, 'status')}, ` +
      `address ${field(subscription, 'address')}, created ${field(subscription, 'created_at')}, ` +
      `expires ${field(subscription, 'expire_at')}, stopped ${field(subscription, 'stopped_at')}`
  );
}

function printTransaction(transaction: unknown): void {
  console.log(
    `  ${field(transaction, 'id')} ${field(transaction, 'service')} ${field(transaction, 'status')}, ` +
      `charged ${field(transaction, 'amount')}, created ${field(transaction, 'created_at')}`
  );
}

async function main(): Promise<number> {
  const token = env('TRONZAP_API_TOKEN');
  const secret = env('TRONZAP_API_SECRET');
  if (token === undefined || secret === undefined) {
    console.error('set TRONZAP_API_TOKEN and TRONZAP_API_SECRET');
    return 1;
  }

  const baseUrl = env('TRONZAP_BASE_URL') ?? 'https://api.tronzap.com';
  const client = new TronZapClient({
    apiToken: token,
    apiSecret: secret,
    baseUrl,
    timeout: 20_000,
  });
  console.log(`Calling ${baseUrl}`);

  const failed: string[] = [];

  async function step(name: string, call: () => Promise<void>): Promise<void> {
    console.log(`\n${name}`);
    try {
      await call();
    } catch (error) {
      if (!(error instanceof TronZapError)) {
        throw error;
      }
      console.log(`  FAILED: ${error.name}: ${error.message} (code ${String(error.code)})`);
      failed.push(name);
    }
  }

  async function optionalStep(
    name: string,
    subject: string | undefined,
    call: (value: string) => Promise<void>
  ): Promise<void> {
    if (subject === undefined) {
      console.log(`\n${name}\n  skipped: its environment variable is not set`);
      return;
    }
    await step(name, () => call(subject));
  }

  await step('getBalance', async () => {
    const balance: unknown = await client.getBalance();
    console.log(
      `  balance ${field(balance, 'balance')}, deposit address ${field(balance, 'address')}`
    );
  });

  await step('getServices', async () => {
    const services: unknown = await client.getServices();
    for (const rate of rows(services, 'energy')) {
      console.log(
        `  energy ${field(rate, 'duration')}h ${field(rate, 'min_amount')}..${field(rate, 'max_amount')} ` +
          `at ${field(rate, 'price')} per 1000 units (65k = ${field(rate, 'price_65k')})`
      );
    }
    for (const rate of rows(services, 'bandwidth')) {
      console.log(
        `  bandwidth ${field(rate, 'duration')}h ${field(rate, 'min_amount')}..${field(rate, 'max_amount')} ` +
          `at ${field(rate, 'price')} per 1000 units`
      );
    }
    const activation: unknown = (services as Record<string, unknown> | null)?.activate_address;
    if (typeof activation === 'object' && activation !== null) {
      console.log(`  activation ${field(activation, 'price')}`);
    }
  });

  await step('getDirectRechargeInfo', async () => {
    const info: unknown = await client.getDirectRechargeInfo();
    console.log(
      `  pay to ${field(info, 'address')}, ${String(rows(info, 'rates').length)} rate(s)`
    );
  });

  await step('getAmlServices', async () => {
    const services: unknown = await client.getAmlServices();
    for (const service of Array.isArray(services) ? (services as unknown[]) : []) {
      console.log(
        `  ${field(service, 'id')} ${field(service, 'type')} at ${field(service, 'price')}`
      );
    }
  });

  await step('getAmlHistory', async () => {
    const history: unknown = await client.getAmlHistory();
    console.log(
      `  page ${field(history, 'page')}, ${String(rows(history, 'items').length)} of ` +
        `${field(history, 'total')} check(s)`
    );
  });

  await step('getSubscriptions', async () => {
    const plans = await client.getSubscriptions();
    for (const [subscriptionId, plan] of Object.entries(plans)) {
      console.log(
        `  ${subscriptionId} (${field(plan, 'name')}): activation ${field(plan, 'activation_fee')}, ` +
          `initial ${field(plan, 'initial_price')}, ${field(plan, 'price')} per transaction, ` +
          `limit ${field(plan, 'transactions_limit')} transactions, ${field(plan, 'duration_days')} days`
      );
    }
  });

  await step('getSubscriptionHistory', async () => {
    const history: unknown = await client.getSubscriptionHistory(1, 3);
    console.log(
      `  page ${field(history, 'page')}, ${String(rows(history, 'items').length)} of ` +
        `${field(history, 'total')} subscription(s)`
    );
    for (const item of rows(history, 'items')) {
      console.log(
        `  ${field(item, 'id')} ${field(item, 'subscription_id')} ${field(item, 'status')}, ` +
          `used ${field(item, 'transactions_used')}, energy ${field(item, 'energy_used')}, ` +
          `charged ${field(item, 'total_price')}, expires ${field(item, 'expire_at')}`
      );
    }
  });

  const address = env('TRONZAP_ADDRESS');

  await optionalStep('getAddressInfo', address, async value => {
    const info: unknown = await client.getAddressInfo(value);
    const { resources, balances } = (info ?? {}) as Record<string, unknown>;
    const listed =
      typeof balances === 'object' && balances !== null
        ? Object.keys(balances).map(symbol => `${symbol} ${field(balances, symbol)}`)
        : [];
    console.log(
      `  energy ${field(resources, 'energy')}, bandwidth ${field(resources, 'bandwidth')}, ` +
        `balances ${listed.join(', ')}`
    );
  });

  await optionalStep('calculate', address, async value => {
    const calculation: unknown = await client.calculate(value, ENERGY);
    console.log(
      `  ${field(calculation, 'amount')} energy for ${field(calculation, 'duration')}h ` +
        `costs ${field(calculation, 'total')}`
    );
  });

  const toAddress = env('TRONZAP_TO_ADDRESS');
  await optionalStep(
    'estimateEnergy',
    toAddress === undefined ? undefined : env('TRONZAP_FROM_ADDRESS'),
    async value => {
      const estimate: unknown = await client.estimateEnergy(value, toAddress ?? '');
      console.log(`  ${field(estimate, 'amount')} energy, total ${field(estimate, 'total')}`);
    }
  );

  await optionalStep('checkTransaction', env('TRONZAP_TRANSACTION_ID'), async value => {
    printTransaction(await client.checkTransaction(value));
  });

  await optionalStep('checkAmlStatus', env('TRONZAP_AML_CHECK_ID'), async value => {
    const check: unknown = await client.checkAmlStatus(value);
    const risk = field(check, 'risk_score');
    console.log(`  ${field(check, 'status')}, risk ${risk === '-' ? 'not scored yet' : risk}`);
  });

  await optionalStep('checkSubscription', env('TRONZAP_SUBSCRIPTION_ID'), async value => {
    printSubscription(await client.checkSubscription(value));
  });

  if (env('TRONZAP_ALLOW_PURCHASES') !== '1') {
    console.log(
      '\nSkipping purchases: set TRONZAP_ALLOW_PURCHASES=1 to create transactions (debits the balance)'
    );
  } else if (address === undefined) {
    console.log('\nSkipping purchases: TRONZAP_ADDRESS is not set');
  } else {
    const runId = `node-example-${String(Date.now())}`;

    await step('createAddressActivationTransaction', async () => {
      try {
        printTransaction(
          await client.createAddressActivationTransaction(address, `${runId}-activate`)
        );
      } catch (error) {
        if (!(error instanceof ApiError) || error.code !== ErrorCode.ADDRESS_ALREADY_ACTIVATED) {
          throw error;
        }
        console.log('  already activated');
      }
    });

    await step('createEnergyTransaction', async () => {
      printTransaction(await client.createEnergyTransaction(address, ENERGY, 1, `${runId}-energy`));
      printTransaction(await client.checkTransaction(undefined, `${runId}-energy`));
    });

    await step('createBandwidthTransaction', async () => {
      printTransaction(
        await client.createBandwidthTransaction(address, BANDWIDTH, `${runId}-bandwidth`)
      );
    });

    await step('createResourceBundleTransaction', async () => {
      printTransaction(
        await client.createResourceBundleTransaction(
          address,
          ENERGY,
          BANDWIDTH,
          1,
          `${runId}-bundle`
        )
      );
    });

    await step('createAmlCheck', async () => {
      const check: unknown = await client.createAmlCheck('address', 'TRX', address);
      console.log(`  AML check ${field(check, 'id')} is ${field(check, 'status')}`);
    });

    await optionalStep(
      'startSubscription, checkSubscription, stopSubscription',
      env('TRONZAP_SUBSCRIPTION_PLAN'),
      async plan => {
        const started: unknown = await client.startSubscription(
          plan,
          address,
          1,
          0,
          `${runId}-subscription`
        );
        printSubscription(started);
        const id = field(started, 'id');
        try {
          printSubscription(await client.checkSubscription(id));
        } finally {
          printSubscription(await client.stopSubscription(id));
        }
      }
    );
  }

  if (failed.length > 0) {
    console.error(`\nFailed: ${failed.join(', ')}`);
    return 1;
  }
  console.log('\nAll calls succeeded');
  return 0;
}

main().then(
  code => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  }
);
