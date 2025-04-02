# TronZap SDK для Node.js

[English](README.md) | [Español](README.es.md) | [Português](README.pt-br.md) | **[Русский](README.ru.md)**

Официальный SDK Node.js для API TronZap.
Этот SDK позволяет легко интегрировать сервисы TronZap для аренды энергии TRON.

TronZap.com позволяет вам [купить энергию TRON](https://tronzap.com/), делая переводы USDT (TRC20) дешевле за счет значительного снижения комиссий за транзакции.

👉 [Зарегистрируйтесь для получения API ключа](https://tronzap.com), чтобы начать использовать API TronZap и интегрировать его через SDK.

## Установка

```bash
npm install tronzap-sdk
# или
yarn add tronzap-sdk
# или
pnpm add tronzap-sdk
```

## Поддержка платформ

Этот SDK разработан для работы на различных платформах JavaScript/TypeScript:

- **Node.js**: v16.0.0 или выше
- **Bun**: v1.0.0 или выше
- **Deno**: v1.0.0 или выше

## Быстрый старт

```typescript
import { TronZapClient } from 'tronzap-sdk';

// Инициализация клиента
const client = new TronZapClient({
  apiToken: 'ваш_api_токен',
  apiSecret: 'ваш_api_секрет'
});

// Получение доступных сервисов
const services = await client.getServices();
console.log(services);

// Получение баланса аккаунта
const balance = await client.getBalance();
console.log(balance);

// Расчет стоимости энергии
const calculation = await client.calculate(
  'АДРЕС_КОШЕЛЬКА_TRON',
  65150  // Рекомендуемое количество для переводов USDT
);
console.log(calculation);

// Создание транзакции энергии
const transaction = await client.createEnergyTransaction(
  'АДРЕС_КОШЕЛЬКА_TRON',
  65150,
  1,
  'мой-tx-id',  // Опциональный внешний ID
  true        // Опционально: активировать адрес если нужно
);
console.log(transaction);

// Проверка статуса транзакции
const status = await client.checkTransaction('ID_ТРАНЗАКЦИИ');
console.log(status);

// Получение информации о прямой подзарядке
const rechargeInfo = await client.getDirectRechargeInfo();
console.log(rechargeInfo);
```

## Возможности

- Полная поддержка TypeScript
- Кросс-платформенная совместимость (Node.js, Bun, Deno)
- Получение доступных сервисов
- Получение баланса аккаунта
- Расчет стоимости энергии
- Создание транзакций активации адреса
- Создание транзакций покупки энергии
- Проверка статуса транзакций
- Получение информации о прямой подзарядке

## Требования

- Node.js v16.0.0 или выше, или
- Bun v1.0.0 или выше, или
- Deno v1.0.0 или выше

## Обработка ошибок

SDK выбрасывает `TronZapError` когда API возвращает ошибку. Каждая ошибка включает свойства `.code` и `.message` для отладки и обработки конкретных случаев.

### Пример

```typescript
import { TronZapClient, TronZapError, ErrorCode } from 'tronzap-sdk';

const client = new TronZapClient({
  apiToken: 'ваш_api_токен',
  apiSecret: 'ваш_api_секрет'
});

try {
  const balance = await client.getBalance();
} catch (error) {
  if (error instanceof TronZapError) {
    switch (error.code) {
      case ErrorCode.AUTH_ERROR:
        console.error('Ошибка аутентификации');
        break;
      case ErrorCode.INVALID_SERVICE_OR_PARAMS:
        console.error('Неверный сервис или параметры');
        break;
      case ErrorCode.WALLET_NOT_FOUND:
        console.error('Внутренний кошелек не найден. Обратитесь в поддержку.');
        break;
      case ErrorCode.INSUFFICIENT_FUNDS:
        console.error('Недостаточно средств');
        break;
      case ErrorCode.INVALID_TRON_ADDRESS:
        console.error('Неверный адрес TRON');
        break;
      case ErrorCode.INVALID_ENERGY_AMOUNT:
        console.error('Неверное количество энергии');
        break;
      case ErrorCode.INVALID_DURATION:
        console.error('Неверная длительность');
        break;
      case ErrorCode.TRANSACTION_NOT_FOUND:
        console.error('Транзакция не найдена');
        break;
      case ErrorCode.ADDRESS_NOT_ACTIVATED:
        console.error('Адрес не активирован');
        break;
      case ErrorCode.ADDRESS_ALREADY_ACTIVATED:
        console.error('Адрес уже активирован');
        break;
      case ErrorCode.INTERNAL_SERVER_ERROR:
        console.error('Внутренняя ошибка сервера');
        break;
      default:
        console.error(`Необработанная ошибка ${error.code}: ${error.message}`);
    }
  } else {
    console.error('Неожиданная ошибка:', error);
  }
}
```

### Коды ошибок

| Код | Константа                      | Описание |
|-----|--------------------------------|-------------|
| 1   | `AUTH_ERROR`                  | Ошибка аутентификации - Неверный API токен или подпись |
| 2   | `INVALID_SERVICE_OR_PARAMS`   | Неверный сервис или параметры |
| 5   | `WALLET_NOT_FOUND`            | Внутренний кошелек не найден. Обратитесь в поддержку. |
| 6   | `INSUFFICIENT_FUNDS`          | Недостаточно средств |
| 10  | `INVALID_TRON_ADDRESS`        | Неверный адрес TRON |
| 11  | `INVALID_ENERGY_AMOUNT`       | Неверное количество энергии |
| 12  | `INVALID_DURATION`            | Неверная длительность |
| 20  | `TRANSACTION_NOT_FOUND`       | Транзакция не найдена |
| 24  | `ADDRESS_NOT_ACTIVATED`       | Адрес не активирован |
| 25  | `ADDRESS_ALREADY_ACTIVATED`   | Адрес уже активирован |
| 500 | `INTERNAL_SERVER_ERROR`       | Внутренняя ошибка сервера - Обратитесь в поддержку |

## Разработка

```bash
# Установка зависимостей
npm install

# Сборка SDK
npm run build

# Запуск тестов
npm test

# Проверка кода
npm run lint

# Форматирование кода
npm run format
```

## Поддержка

Для поддержки свяжитесь с нами в Telegram: [@tronzap_bot](https://t.me/tronzap_bot)

## Лицензия

Этот проект лицензирован под лицензией MIT - см. файл [LICENSE](LICENSE) для более подробной информации.