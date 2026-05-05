# TronZap SDK для Node.js

[English](README.md) | [Español](README.es.md) | [Português](README.pt-br.md) | **[Русский](README.ru.md)**

Официальный SDK Node.js для API TronZap.
Этот SDK позволяет легко интегрировать сервисы TronZap для аренды энергии TRON.

TronZap.com позволяет вам [купить энергию TRON](https://tronzap.com/), делая переводы USDT (TRC20) дешевле за счет значительного снижения комиссий за транзакции.

👉 [Зарегистрируйтесь для получения API ключа](https://tronzap.com), чтобы начать использовать Tron Energy API и интегрировать его через SDK.

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

// Получение информации об адресе (ресурсы и балансы)
const addressInfo = await client.getAddressInfo('TRX_ADDRESS');
console.log(addressInfo);

// Оценка количества энергии для перевода USDT
const estimate = await client.estimateEnergy(
  'АДРЕС_ОТПРАВИТЕЛЯ_TRX',
  'АДРЕС_ПОЛУЧАТЕЛЯ_TRX',
  'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' // Адрес контракта USDT
);
console.log(estimate);

// Расчет стоимости энергии
const calculation = await client.calculate(
  'АДРЕС_КОШЕЛЬКА_TRON',
  65150  // Рекомендуемое количество для переводов USDT
);
console.log(calculation);

// Создание транзакции энергии
const transaction = await client.createEnergyTransaction(
  'АДРЕС_КОШЕЛЬКА_TRON',
  65150, // От 60000
  1, // Возможные значения: 1 или 24 часа
  'мой-trx-id',  // Опциональный внешний ID
  true        // Опционально: активировать адрес если нужно
);
console.log(transaction);

// Покупка bandwidth
const bandwidth = await client.createBandwidthTransaction(
  'АДРЕС_КОШЕЛЬКА_TRON',
  1000,
  'bandwidth-1'
);
console.log(bandwidth);

// Покупка пакета ресурсов (energy + bandwidth одной транзакцией)
const bundle = await client.createResourceBundleTransaction(
  'АДРЕС_КОШЕЛЬКА_TRON',
  65000, // количество energy
  350,   // количество bandwidth
  1,     // длительность (часы)
  'bundle-1', // внешний ID (опционально)
  true        // опционально: активация адреса
);
console.log(bundle);

// Проверка статуса транзакции
const status = await client.checkTransaction(transaction.id);
console.log(status);

// Создание AML-проверки
const amlCheck = await client.createAmlCheck(
  'address',
  'TRX',
  'TXYZ1234567890EXAMPLEADDRESS'
);
console.log(amlCheck);

// Проверка статуса AML
const amlStatus = await client.checkAmlStatus(amlCheck.id);
console.log(amlStatus);

// Получение информации о прямой подзарядке
const rechargeInfo = await client.getDirectRechargeInfo();
console.log(rechargeInfo);
```

## Возможности

- Полная поддержка TypeScript
- Кросс-платформенная совместимость (Node.js, Bun, Deno)
- Получение доступных сервисов
- Получение AML-сервисов
- Получение баланса аккаунта
- Получение информации об адресе (ресурсы и балансы)
- Расчет стоимости энергии
- Создание транзакций активации адреса
- Создание транзакций покупки энергии
- Создание транзакций покупки bandwidth
- Создание транзакций пакета ресурсов (energy + bandwidth)
- Создание и отслеживание AML-проверок
- Проверка статуса транзакций
- Получение информации о прямой подзарядке

## Требования

- Node.js v16.0.0 или выше, или
- Bun v1.0.0 или выше, или
- Deno v1.0.0 или выше

## Обработка ошибок

SDK использует иерархию классов ошибок для точной обработки:

```
TronZapError
├── ApiError             — ошибки API (code != 0 в ответе)
├── NetworkError         — сетевые ошибки
│   ├── ConnectionError  — невозможно подключиться к серверу
│   ├── TimeoutError     — превышено время ожидания
│   └── SslError         — ошибки SSL/TLS
└── HttpError            — HTTP-ответы с кодом не 2xx
    ├── RateLimitError   — HTTP 429 Too Many Requests
    ├── UnauthorizedError — HTTP 401/403
    └── ServerError      — HTTP 5xx
```

### Пример

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
  apiToken: 'ваш_api_токен',
  apiSecret: 'ваш_api_секрет',
});

try {
  const transaction = await client.createEnergyTransaction('TRX_ADDRESS', 65000, 1);
} catch (error) {
  if (error instanceof ApiError) {
    // Ошибка API (неверные параметры, недостаточно средств и т.д.)
    console.error(`Ошибка API [${error.code}]: ${error.message}`);

    // Ключ-алиас ошибки, например "invalid_tron_address" или "invalid_tron_address.from_address"
    if (error.errorKey) {
      console.error(`Ключ ошибки: ${error.errorKey}`);
    }

    if (error.code === ErrorCode.INVALID_TRON_ADDRESS) {
      console.error('Проверьте формат адреса TRON.');
    }
  } else if (error instanceof RateLimitError) {
    console.error('Слишком много запросов. Замедлите частоту обращений.');
  } else if (error instanceof UnauthorizedError) {
    console.error('Неверный API-токен или подпись.');
  } else if (error instanceof ServerError) {
    console.error(`Ошибка сервера TronZap [${error.statusCode}].`);
  } else if (error instanceof HttpError) {
    console.error(`HTTP-ошибка [${error.statusCode}]: ${error.message}`);
  } else if (error instanceof TimeoutError) {
    console.error('Превышено время ожидания запроса.');
  } else if (error instanceof SslError) {
    console.error(`Ошибка SSL: ${error.message}`);
  } else if (error instanceof NetworkError) {
    console.error(`Сетевая ошибка: ${error.message}`);
  } else if (error instanceof TronZapError) {
    console.error(`Ошибка [${error.code}]: ${error.message}`);
  } else {
    console.error('Неожиданная ошибка:', error);
  }
}
```

### Коды ошибок API

| Код | Константа                      | Описание |
|-----|--------------------------------|----------|
| 1   | `AUTH_ERROR`                  | Ошибка аутентификации — неверный API-токен или подпись |
| 2   | `INVALID_SERVICE_OR_PARAMS`   | Неверный сервис или параметры |
| 5   | `WALLET_NOT_FOUND`            | Внутренний кошелёк не найден. Обратитесь в поддержку. |
| 6   | `INSUFFICIENT_FUNDS`          | Недостаточно средств |
| 10  | `INVALID_TRON_ADDRESS`        | Неверный адрес TRON |
| 11  | `INVALID_ENERGY_AMOUNT`       | Неверное количество энергии |
| 12  | `INVALID_DURATION`            | Неверная длительность |
| 20  | `TRANSACTION_NOT_FOUND`       | Транзакция/подписка не найдена |
| 21  | `CANNOT_STOP_SUBSCRIPTION`    | Невозможно остановить подписку |
| 24  | `ADDRESS_NOT_ACTIVATED`       | Адрес не активирован |
| 25  | `ADDRESS_ALREADY_ACTIVATED`   | Адрес уже активирован |
| 30  | `AML_CHECK_NOT_FOUND`         | AML-проверка не найдена |
| 35  | `SERVICE_NOT_AVAILABLE`       | Сервис недоступен |
| 50  | `INVALID_BANDWIDTH_AMOUNT`    | Неверное количество bandwidth |
| 500 | `INTERNAL_SERVER_ERROR`       | Внутренняя ошибка сервера — обратитесь в поддержку |

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
