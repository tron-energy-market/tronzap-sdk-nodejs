# Aluguel de Energia Tron via API
## SDK Node.js por TronZap.com

[English](https://github.com/tron-energy-market/tronzap-sdk-nodejs/blob/main/README.md) | [Español](https://github.com/tron-energy-market/tronzap-sdk-nodejs/blob/main/README.es.md) | **[Português](https://github.com/tron-energy-market/tronzap-sdk-nodejs/blob/main/README.pt-br.md)** | [Русский](https://github.com/tron-energy-market/tronzap-sdk-nodejs/blob/main/README.ru.md)

SDK oficial em Node.js para a API do TronZap.
Este SDK permite integrar facilmente os serviços TronZap para aluguel de energia TRON.

TronZap.com permite [comprar energia TRON](https://tronzap.com/), reduzindo significativamente as taxas nas transferências de USDT (TRC20).

👉 [Registre-se para obter uma chave API](https://tronzap.com) para começar a usar a API TronZap e integrá-la através do SDK.

## Instalação

```bash
npm install tronzap-sdk
# ou
yarn add tronzap-sdk
# ou
pnpm add tronzap-sdk
```

## Suporte a Plataformas

Este SDK foi projetado para funcionar em múltiplas plataformas JavaScript/TypeScript:

- **Node.js**: 20 ou superior
- **Bun**: 1.x
- **Deno**: 2.x

Os testes rodam em todos eles no CI. O SDK não tem dependências em tempo de execução e usa o `fetch` nativo.

## Início Rápido

```typescript
import { TronZapClient } from 'tronzap-sdk';

// Inicializar o cliente
const client = new TronZapClient({
  apiToken: 'seu_api_token',
  apiSecret: 'seu_api_secret',
  // Opcional: URL base, tempo limite em milissegundos (30000 por padrão) e seu próprio fetch
  // baseUrl: 'https://api.tronzap.com',
  // timeout: 30_000,
  // fetch: myFetch,
});

// Obter serviços disponíveis
const services = await client.getServices();
console.log(services);

// Obter saldo da conta
const balance = await client.getBalance();
console.log(balance);

// Obter informações do endereço (recursos e saldos)
const addressInfo = await client.getAddressInfo('TRX_ADDRESS');
console.log(addressInfo);

// Estimar quantidade de energia para uma transferência USDT (TRC20); passe o endereço do contrato como terceiro argumento para outro token
const estimate = await client.estimateEnergy(
  'ENDERECO_ORIGEM_TRX',
  'ENDERECO_DESTINO_TRX'
);
console.log(estimate);

// Calcular custo de energia
const calculation = await client.calculate(
  'ENDERECO_CARTEIRA_TRON',
  65000  // Quantidade de energia
);
console.log(calculation);

// Criar transação de energia
const transaction = await client.createEnergyTransaction(
  'ENDERECO_CARTEIRA_TRON',
  65000, // Quantidade de energia
  1, // Duração (horas): uma das durações que getServices() lista
  'meu-tx-id',  // ID externo opcional
  true        // Opcional: ativar endereço se necessário
);
console.log(transaction);

// Comprar bandwidth
const bandwidth = await client.createBandwidthTransaction(
  'ENDERECO_CARTEIRA_TRON',
  345,
  'bandwidth-1'
);
console.log(bandwidth);

// Comprar pacote de recursos (energia + bandwidth em uma só transação)
const bundle = await client.createResourceBundleTransaction(
  'ENDERECO_CARTEIRA_TRON',
  65000, // quantidade de energia
  345,   // quantidade de bandwidth
  1,     // duração (horas)
  'bundle-1', // ID externo opcional
  true        // opcional: ativar endereço
);
console.log(bundle);

// Verificar status da transação
const status = await client.checkTransaction(transaction.id);
console.log(status);

// Criar checagem AML
const amlCheck = await client.createAmlCheck(
  'address',
  'TRX',
  'ENDERECO_CARTEIRA_TRON'
);
console.log(amlCheck);

// Verificar status AML
const amlStatus = await client.checkAmlStatus(amlCheck.id);
console.log(amlStatus);

// Obter informações de recarga direta
const rechargeInfo = await client.getDirectRechargeInfo();
console.log(rechargeInfo);

// Todos os métodos aceitam opções de requisição como último argumento: um tempo limite ou um AbortSignal
// Ao abortar com controller.abort(), a chamada é rejeitada com o motivo do sinal
const controller = new AbortController();
const quickBalance = await client.getBalance({ timeout: 5_000, signal: controller.signal });
```

## Recursos

- Suporte completo para TypeScript
- Compatibilidade multiplataforma (Node.js, Bun, Deno)
- Tempo limite e cancelamento de requisições com `AbortSignal`
- Obter serviços disponíveis
- Obter serviços AML
- Obter saldo da conta
- Obter informações do endereço (recursos e saldos)
- Calcular custo de energia
- Criar transações de ativação de endereço
- Criar transações de compra de energia
- Criar transações de compra de bandwidth
- Criar transações de pacote de recursos (energia + bandwidth)
- Criar e acompanhar checagens AML
- Verificar status de transações
- Obter informações de recarga direta
- Listar planos de assinatura, iniciar, consultar e parar assinaturas, histórico de assinaturas

## Requisitos

- Node.js 20 ou superior, Bun 1.x ou Deno 2.x

## Verificações AML

```typescript
const addressCheck = await client.createAmlCheck('address', 'TRX', 'ENDERECO_CARTEIRA_TRON');

// ou um hash de transação: rede, endereço do destinatário, hash e direção
const hashCheck = await client.createAmlCheck('hash', 'BTC', 'ENDERECO_DESTINATARIO_BTC', 'HASH_TX', 'withdrawal');
```

Em uma verificação por hash, `address` é o endereço do destinatário da transação, onde os fundos foram recebidos, e `direction` indica de que lado você está: `'deposit'` se os fundos chegaram ao seu endereço (`address` é o seu endereço), `'withdrawal'` se foi você quem enviou (`address` é o endereço do destinatário externo). O risco é calculado para a contraparte: o remetente em um deposit, o destinatário em um withdrawal. Se `direction` for omitida, o SDK envia `'deposit'`.

## Assinaturas

Uma assinatura mantém um endereço abastecido de energia para cada transação até ser parada ou esgotar seus dias ou transações. Escolha um plano de `getSubscriptions()`, um objeto com um plano por chave na ordem da API, e passe a sua chave, como `'unlimited_energy'`, não o `id` numérico do plano. Iniciar uma assinatura cobra o preço inicial do plano.

```typescript
const plans = await client.getSubscriptions();
for (const [subscriptionId, plan] of Object.entries(plans)) {
  console.log(subscriptionId, plan.initial_price, plan.price);
}

const subscription = await client.startSubscription(
  'unlimited_energy',
  'TRON_WALLET_ADDRESS',
  30, // 0 para não limitar o tempo
  0,  // 0 para não limitar
  'subscription-42' // ID externo opcional
);

await client.checkSubscription(undefined, 'subscription-42');
await client.stopSubscription(subscription.id);

const history = await client.getSubscriptionHistory(1, 10, 'active');
```

`durationDays` (em dias, ao contrário das horas das transações) e `transactionsLimit` valem 0 por padrão, o que significa sem limite. `checkSubscription` e `stopSubscription` aceitam o `id` da assinatura, o seu `externalId` ou ambos, como `checkTransaction`. A paginação do histórico usa por padrão a página 1 com 10 itens.

Iniciar, consultar e parar retornam a assinatura com seus `params`; os itens do histórico trazem em vez disso os contadores de uso `transactions_used`, `energy_used` e `total_price`. Uma assinatura com limite de transações não pode ser parada (`ErrorCode.CANNOT_STOP_SUBSCRIPTION`).

## Tratamento de Erros

O SDK utiliza uma hierarquia de classes de erro para tratamento preciso:

```
TronZapError
├── ApiError             — erros a nível de API (code != 0 na resposta)
├── InvalidRequestError  — Argumentos inválidos, rejeitados antes do envio
├── NetworkError         — erros de rede/conectividade
│   ├── ConnectionError  — não foi possível conectar ao servidor
│   ├── TimeoutError     — tempo de espera esgotado
│   └── SslError         — erros SSL/TLS
└── HttpError            — respostas HTTP não 2xx
    ├── RateLimitError   — HTTP 429 Too Many Requests
    ├── UnauthorizedError — HTTP 401/403
    └── ServerError      — erros HTTP 5xx
```

### Exemplo

```typescript
import {
  TronZapClient,
  ApiError,
  HttpError,
  InvalidRequestError,
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
  apiToken: 'seu_api_token',
  apiSecret: 'seu_api_secret',
});

try {
  const transaction = await client.createEnergyTransaction('TRX_ADDRESS', 65000, 1);
} catch (error) {
  if (error instanceof ApiError) {
    // Erro a nível de API (parâmetros inválidos, saldo insuficiente, etc.)
    console.error(`Erro API [${error.code}]: ${error.message}`);

    // Chave alias do erro, ex. "invalid_tron_address" ou "invalid_tron_address.from_address"
    if (error.errorKey) {
      console.error(`Chave de erro: ${error.errorKey}`);
    }

    // Informe-o ao contatar o suporte
    console.error(`ID da requisição: ${error.requestId ?? '-'}`);

    if (error.code === ErrorCode.INVALID_TRON_ADDRESS) {
      console.error('Verifique o formato do endereço TRON.');
    }
  } else if (error instanceof InvalidRequestError) {
    console.error(`Argumentos inválidos: ${error.message}`);
  } else if (error instanceof RateLimitError) {
    console.error('Muitas requisições. Reduza a frequência.');
  } else if (error instanceof UnauthorizedError) {
    console.error('Token API ou assinatura inválidos.');
  } else if (error instanceof ServerError) {
    console.error(`Erro do servidor TronZap [${error.statusCode}].`);
  } else if (error instanceof HttpError) {
    console.error(`Erro HTTP [${error.statusCode}]: ${error.message}`);
  } else if (error instanceof TimeoutError) {
    console.error('Tempo de espera esgotado.');
  } else if (error instanceof SslError) {
    console.error(`Erro SSL: ${error.message}`);
  } else if (error instanceof NetworkError) {
    console.error(`Erro de rede: ${error.message}`);
  } else if (error instanceof TronZapError) {
    console.error(`Erro [${error.code}]: ${error.message}`);
  } else {
    console.error('Erro inesperado:', error);
  }
}
```

### Códigos de erro da API

| Código | Constante                      | Descrição |
|--------|--------------------------------|-----------|
| 1      | `AUTH_ERROR`                  | Erro de autenticação — token API ou assinatura inválidos |
| 2      | `INVALID_SERVICE_OR_PARAMS`   | Serviço ou parâmetros inválidos |
| 5      | `WALLET_NOT_FOUND`            | Carteira interna não encontrada. Contate o suporte. |
| 6      | `INSUFFICIENT_FUNDS`          | Saldo insuficiente |
| 10     | `INVALID_TRON_ADDRESS`        | Endereço TRON inválido, ou o endereço já tem uma assinatura ativa |
| 11     | `INVALID_ENERGY_AMOUNT`       | Quantidade de energia inválida |
| 12     | `INVALID_DURATION`            | Duração inválida |
| 20     | `TRANSACTION_NOT_FOUND`       | Transação/assinatura não encontrada |
| 21     | `CANNOT_STOP_SUBSCRIPTION`    | Não é possível parar a assinatura, p. ex. ela tem limite de transações |
| 24     | `ADDRESS_NOT_ACTIVATED`       | Endereço não ativado |
| 25     | `ADDRESS_ALREADY_ACTIVATED`   | Endereço já ativado |
| 30     | `AML_CHECK_NOT_FOUND`         | Checagem AML não encontrada |
| 35     | `SERVICE_NOT_AVAILABLE`       | Serviço não disponível |
| 50     | `INVALID_BANDWIDTH_AMOUNT`    | Quantidade de bandwidth inválida |
| 500    | `INTERNAL_SERVER_ERROR`       | Erro interno do servidor — contate o suporte |

## Desenvolvimento

```bash
# Instalar dependências
npm ci

# Executar testes
npm test

# Verificar código
npm run lint

# Os mesmos testes no Bun e no Deno, se estiverem instalados
npm run test:bun
npm run test:deno
```

Os testes usam um servidor HTTP/TLS local e nunca chamam a API real. `examples/basic-usage.ts` é um teste de fumaça contra um ambiente real (`npm run example`); as instruções estão no início do arquivo.

## Suporte

Para suporte, entre em contato conosco no Telegram: [@tronzap_bot](https://t.me/tronzap_bot)

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.
