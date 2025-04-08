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

// Calcular custo de energia
const calculation = await client.calculate(
  'ENDERECO_CARTEIRA_TRON',
  65150  // Quantidade recomendada para transferências USDT
);
console.log(calculation);

// Criar transação de energia
const transaction = await client.createEnergyTransaction(
  'ENDERECO_CARTEIRA_TRON',
  65150, // A partir de 32000
  1, // Valores possíveis: 1 ou 24 horas
  'meu-tx-id',  // ID externo opcional
  true        // Opcional: ativar endereço se necessário
);
console.log(transaction);

// Verificar status da transação
const status = await client.checkTransaction('ID_TRANSACAO');
console.log(status);

// Obter informações de recarga direta
const rechargeInfo = await client.getDirectRechargeInfo();
console.log(rechargeInfo);
```

## Recursos

- Suporte completo para TypeScript
- Compatibilidade multiplataforma (Node.js, Bun, Deno)
- Obter serviços disponíveis
- Obter saldo da conta
- Calcular custo de energia
- Criar transações de ativação de endereço
- Criar transações de compra de energia
- Verificar status de transações
- Obter informações de recarga direta

## Requisitos

- Node.js v16.0.0 ou superior, ou
- Bun v1.0.0 ou superior, ou
- Deno v1.0.0 ou superior

## Tratamento de Erros

O SDK lança `TronZapError` quando a API retorna um erro. Cada erro inclui uma propriedade `.code` e `.message` para depuração e tratamento de casos específicos.

### Exemplo

```typescript
import { TronZapClient, TronZapError, ErrorCode } from 'tronzap-sdk';

const client = new TronZapClient({
  apiToken: 'seu_api_token',
  apiSecret: 'seu_api_secret'
});

try {
  const balance = await client.getBalance();
} catch (error) {
  if (error instanceof TronZapError) {
    switch (error.code) {
      case ErrorCode.AUTH_ERROR:
        console.error('Erro de autenticação');
        break;
      case ErrorCode.INVALID_SERVICE_OR_PARAMS:
        console.error('Serviço ou parâmetros inválidos');
        break;
      case ErrorCode.WALLET_NOT_FOUND:
        console.error('Carteira interna não encontrada. Entre em contato com o suporte.');
        break;
      case ErrorCode.INSUFFICIENT_FUNDS:
        console.error('Fundos insuficientes');
        break;
      case ErrorCode.INVALID_TRON_ADDRESS:
        console.error('Endereço TRON inválido');
        break;
      case ErrorCode.INVALID_ENERGY_AMOUNT:
        console.error('Quantidade de energia inválida');
        break;
      case ErrorCode.INVALID_DURATION:
        console.error('Duração inválida');
        break;
      case ErrorCode.TRANSACTION_NOT_FOUND:
        console.error('Transação não encontrada');
        break;
      case ErrorCode.ADDRESS_NOT_ACTIVATED:
        console.error('Endereço não ativado');
        break;
      case ErrorCode.ADDRESS_ALREADY_ACTIVATED:
        console.error('Endereço já ativado');
        break;
      case ErrorCode.INTERNAL_SERVER_ERROR:
        console.error('Erro interno do servidor');
        break;
      default:
        console.error(`Erro não tratado ${error.code}: ${error.message}`);
    }
  } else {
    console.error('Erro inesperado:', error);
  }
}
```

### Códigos de Erro

| Código | Constante                      | Descrição |
|--------|--------------------------------|-------------|
| 1      | `AUTH_ERROR`                  | Erro de autenticação - Token API ou assinatura inválidos |
| 2      | `INVALID_SERVICE_OR_PARAMS`   | Serviço ou parâmetros inválidos |
| 5      | `WALLET_NOT_FOUND`            | Carteira interna não encontrada. Entre em contato com o suporte. |
| 6      | `INSUFFICIENT_FUNDS`          | Fundos insuficientes |
| 10     | `INVALID_TRON_ADDRESS`        | Endereço TRON inválido |
| 11     | `INVALID_ENERGY_AMOUNT`       | Quantidade de energia inválida |
| 12     | `INVALID_DURATION`            | Duração inválida |
| 20     | `TRANSACTION_NOT_FOUND`       | Transação não encontrada |
| 24     | `ADDRESS_NOT_ACTIVATED`       | Endereço não ativado |
| 25     | `ADDRESS_ALREADY_ACTIVATED`   | Endereço já ativado |
| 500    | `INTERNAL_SERVER_ERROR`       | Erro interno do servidor - Entre em contato com o suporte |

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