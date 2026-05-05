# TronZap SDK para Node.js

[English](README.md) | [Español](README.es.md) | **[Português](README.pt-br.md)** | [Русский](README.ru.md)

SDK oficial do Node.js para a API do TronZap.
Este SDK permite que você integre facilmente os serviços do TronZap para aluguel de energia TRON.

O TronZap.com permite que você [compre energia TRON](https://tronzap.com/), tornando as transferências de USDT (TRC20) mais baratas ao reduzir significativamente as taxas de transação.

👉 [Registre-se para obter uma chave API](https://tronzap.com) para começar a usar a Tron Energy API e integrá-la através do SDK.

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

- **Node.js**: v16.0.0 ou superior
- **Bun**: v1.0.0 ou superior
- **Deno**: v1.0.0 ou superior

## Início Rápido

```typescript
import { TronZapClient } from 'tronzap-sdk';

// Inicializar o cliente
const client = new TronZapClient({
  apiToken: 'seu_api_token',
  apiSecret: 'seu_api_secret'
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

// Estimar quantidade de energia para transferência USDT
const estimate = await client.estimateEnergy(
  'ENDERECO_ORIGEM_TRX',
  'ENDERECO_DESTINO_TRX',
  'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' // Endereço do contrato USDT
);
console.log(estimate);

// Calcular custo de energia
const calculation = await client.calculate(
  'ENDERECO_CARTEIRA_TRON',
  65150  // Quantidade recomendada para transferências USDT
);
console.log(calculation);

// Criar transação de energia
const transaction = await client.createEnergyTransaction(
  'ENDERECO_CARTEIRA_TRON',
  65150, // A partir de 60000
  1, // Valores possíveis: 1 ou 24 horas
  'meu-tx-id',  // ID externo opcional
  true        // Opcional: ativar endereço se necessário
);
console.log(transaction);

// Comprar bandwidth
const bandwidth = await client.createBandwidthTransaction(
  'ENDERECO_CARTEIRA_TRON',
  1000,
  'bandwidth-1'
);
console.log(bandwidth);

// Comprar pacote de recursos (energia + bandwidth em uma só transação)
const bundle = await client.createResourceBundleTransaction(
  'ENDERECO_CARTEIRA_TRON',
  65000, // quantidade de energia
  350,   // quantidade de bandwidth
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
  'TXYZ1234567890EXAMPLEADDRESS'
);
console.log(amlCheck);

// Verificar status AML
const amlStatus = await client.checkAmlStatus(amlCheck.id);
console.log(amlStatus);

// Obter informações de recarga direta
const rechargeInfo = await client.getDirectRechargeInfo();
console.log(rechargeInfo);
```

## Recursos

- Suporte completo para TypeScript
- Compatibilidade multiplataforma (Node.js, Bun, Deno)
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

## Requisitos

- Node.js v16.0.0 ou superior, ou
- Bun v1.0.0 ou superior, ou
- Deno v1.0.0 ou superior

## Tratamento de Erros

O SDK utiliza uma hierarquia de classes de erro para tratamento preciso:

```
TronZapError
├── ApiError             — erros a nível de API (code != 0 na resposta)
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

    if (error.code === ErrorCode.INVALID_TRON_ADDRESS) {
      console.error('Verifique o formato do endereço TRON.');
    }
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
| 10     | `INVALID_TRON_ADDRESS`        | Endereço TRON inválido |
| 11     | `INVALID_ENERGY_AMOUNT`       | Quantidade de energia inválida |
| 12     | `INVALID_DURATION`            | Duração inválida |
| 20     | `TRANSACTION_NOT_FOUND`       | Transação/assinatura não encontrada |
| 21     | `CANNOT_STOP_SUBSCRIPTION`    | Não é possível parar a assinatura |
| 24     | `ADDRESS_NOT_ACTIVATED`       | Endereço não ativado |
| 25     | `ADDRESS_ALREADY_ACTIVATED`   | Endereço já ativado |
| 30     | `AML_CHECK_NOT_FOUND`         | Checagem AML não encontrada |
| 35     | `SERVICE_NOT_AVAILABLE`       | Serviço não disponível |
| 50     | `INVALID_BANDWIDTH_AMOUNT`    | Quantidade de bandwidth inválida |
| 500    | `INTERNAL_SERVER_ERROR`       | Erro interno do servidor — contate o suporte |

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Construir o SDK
npm run build

# Executar testes
npm test

# Verificar código
npm run lint

# Formatar código
npm run format
```

## Suporte

Para suporte, entre em contato conosco no Telegram: [@tronzap_bot](https://t.me/tronzap_bot)

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.
