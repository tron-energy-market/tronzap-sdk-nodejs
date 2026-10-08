# TronZap SDK para Node.js

[English](https://github.com/tron-energy-market/tronzap-sdk-nodejs/blob/main/README.md) | **[Español](https://github.com/tron-energy-market/tronzap-sdk-nodejs/blob/main/README.es.md)** | [Português](https://github.com/tron-energy-market/tronzap-sdk-nodejs/blob/main/README.pt-br.md) | [Русский](https://github.com/tron-energy-market/tronzap-sdk-nodejs/blob/main/README.ru.md)

SDK oficial de Node.js para la API de TronZap.
Este SDK te permite integrar fácilmente los servicios de TronZap para el alquiler de energía TRON.

TronZap.com te permite [comprar energía TRON](https://tronzap.com/), haciendo que las transferencias de USDT (TRC20) sean más baratas al reducir significativamente las tarifas de transacción.

👉 [Regístrate para obtener una clave API](https://tronzap.com) para comenzar a usar la Tron Energy API e integrarla a través del SDK.

## Instalación

```bash
npm install tronzap-sdk
# o
yarn add tronzap-sdk
# o
pnpm add tronzap-sdk
```

## Soporte de Plataformas

Este SDK está diseñado para funcionar en múltiples plataformas JavaScript/TypeScript:

- **Node.js**: 20 o superior
- **Bun**: 1.x
- **Deno**: 2.x

Las pruebas se ejecutan en todos ellos en CI. El SDK no tiene dependencias en tiempo de ejecución y usa el `fetch` integrado.

## Inicio Rápido

```typescript
import { TronZapClient } from 'tronzap-sdk';

// Inicializar el cliente
const client = new TronZapClient({
  apiToken: 'tu_api_token',
  apiSecret: 'tu_api_secret',
  // Opcional: URL base, tiempo de espera en milisegundos (30000 por defecto) y tu propio fetch
  // baseUrl: 'https://api.tronzap.com',
  // timeout: 30_000,
  // fetch: myFetch,
});

// Obtener servicios disponibles
const services = await client.getServices();
console.log(services);

// Obtener saldo de la cuenta
const balance = await client.getBalance();
console.log(balance);

// Obtener información de la dirección (recursos y saldos)
const addressInfo = await client.getAddressInfo('TRX_ADDRESS');
console.log(addressInfo);

// Estimar cantidad de energía para una transferencia USDT (TRC20); pasa la dirección del contrato como tercer argumento para otro token
const estimate = await client.estimateEnergy(
  'DIRECCION_ORIGEN_TRX',
  'DIRECCION_DESTINO_TRX'
);
console.log(estimate);

// Calcular costo de energía
const calculation = await client.calculate(
  'DIRECCION_BILLETERA_TRON',
  65000  // Cantidad de energía
);
console.log(calculation);

// Crear transacción de energía
const transaction = await client.createEnergyTransaction(
  'DIRECCION_BILLETERA_TRON',
  65000, // Cantidad de energía
  1, // Duración (horas): una de las duraciones que lista getServices()
  'mi-tx-id',  // ID externo opcional
  true        // Opcional: activar dirección si es necesario
);
console.log(transaction);

// Comprar ancho de banda
const bandwidth = await client.createBandwidthTransaction(
  'DIRECCION_BILLETERA_TRON',
  345,
  'bandwidth-1'
);
console.log(bandwidth);

// Comprar un paquete de recursos (energía + ancho de banda en una sola transacción)
const bundle = await client.createResourceBundleTransaction(
  'DIRECCION_BILLETERA_TRON',
  65000, // cantidad de energía
  345,   // cantidad de ancho de banda
  1,     // duración (horas)
  'bundle-1', // ID externo opcional
  true        // opcional: activar dirección
);
console.log(bundle);

// Verificar estado de la transacción
const status = await client.checkTransaction(transaction.id);
console.log(status);

// Crear chequeo AML
const amlCheck = await client.createAmlCheck(
  'address',
  'TRX',
  'DIRECCION_BILLETERA_TRON'
);
console.log(amlCheck);

// Verificar estado AML
const amlStatus = await client.checkAmlStatus(amlCheck.id);
console.log(amlStatus);

// Obtener información de recarga directa
const rechargeInfo = await client.getDirectRechargeInfo();
console.log(rechargeInfo);

// Todos los métodos aceptan opciones de solicitud como último argumento: un tiempo de espera o un AbortSignal
// Al abortar con controller.abort(), la llamada se rechaza con el motivo de la señal
const controller = new AbortController();
const quickBalance = await client.getBalance({ timeout: 5_000, signal: controller.signal });
```

## Características

- Soporte completo para TypeScript
- Compatibilidad multiplataforma (Node.js, Bun, Deno)
- Tiempos de espera y cancelación de solicitudes con `AbortSignal`
- Obtener servicios disponibles
- Obtener servicios AML
- Obtener saldo de cuenta
- Obtener información de dirección (recursos y saldos)
- Calcular costo de energía
- Crear transacciones de activación de dirección
- Crear transacciones de compra de energía
- Crear transacciones de compra de ancho de banda
- Crear transacciones de paquete de recursos (energía + ancho de banda)
- Crear y seguir chequeos AML
- Verificar estado de transacciones
- Obtener información de recarga directa

## Requisitos

- Node.js 20 o superior, Bun 1.x o Deno 2.x

## Manejo de Errores

El SDK utiliza una jerarquía de clases de error para un manejo preciso:

```
TronZapError
├── ApiError             — errores a nivel de API (code != 0 en la respuesta)
├── InvalidRequestError  — Argumentos inválidos, rechazados antes del envío
├── NetworkError         — errores de red/conectividad
│   ├── ConnectionError  — no se pudo conectar al servidor
│   ├── TimeoutError     — tiempo de espera agotado
│   └── SslError         — errores SSL/TLS
└── HttpError            — respuestas HTTP no 2xx
    ├── RateLimitError   — HTTP 429 Too Many Requests
    ├── UnauthorizedError — HTTP 401/403
    └── ServerError      — errores HTTP 5xx
```

### Ejemplo

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
  apiToken: 'tu_api_token',
  apiSecret: 'tu_api_secret',
});

try {
  const transaction = await client.createEnergyTransaction('TRX_ADDRESS', 65000, 1);
} catch (error) {
  if (error instanceof ApiError) {
    // Error a nivel de API (parámetros inválidos, fondos insuficientes, etc.)
    console.error(`Error API [${error.code}]: ${error.message}`);

    // Clave alias del error, p.ej. "invalid_tron_address" o "invalid_tron_address.from_address"
    if (error.errorKey) {
      console.error(`Clave de error: ${error.errorKey}`);
    }

    // Indícalo al contactar con soporte
    console.error(`ID de solicitud: ${error.requestId ?? '-'}`);

    if (error.code === ErrorCode.INVALID_TRON_ADDRESS) {
      console.error('Revisa el formato de la dirección TRON.');
    }
  } else if (error instanceof InvalidRequestError) {
    console.error(`Argumentos inválidos: ${error.message}`);
  } else if (error instanceof RateLimitError) {
    console.error('Demasiadas solicitudes. Reduce la frecuencia.');
  } else if (error instanceof UnauthorizedError) {
    console.error('Token API o firma inválidos.');
  } else if (error instanceof ServerError) {
    console.error(`Error del servidor TronZap [${error.statusCode}].`);
  } else if (error instanceof HttpError) {
    console.error(`Error HTTP [${error.statusCode}]: ${error.message}`);
  } else if (error instanceof TimeoutError) {
    console.error('Tiempo de espera agotado.');
  } else if (error instanceof SslError) {
    console.error(`Error SSL: ${error.message}`);
  } else if (error instanceof NetworkError) {
    console.error(`Error de red: ${error.message}`);
  } else if (error instanceof TronZapError) {
    console.error(`Error [${error.code}]: ${error.message}`);
  } else {
    console.error('Error inesperado:', error);
  }
}
```

### Códigos de error de la API

| Código | Constante                      | Descripción |
|--------|--------------------------------|-------------|
| 1      | `AUTH_ERROR`                  | Error de autenticación — token API o firma inválidos |
| 2      | `INVALID_SERVICE_OR_PARAMS`   | Servicio o parámetros inválidos |
| 5      | `WALLET_NOT_FOUND`            | Billetera interna no encontrada. Contacta a soporte. |
| 6      | `INSUFFICIENT_FUNDS`          | Fondos insuficientes |
| 10     | `INVALID_TRON_ADDRESS`        | Dirección TRON inválida |
| 11     | `INVALID_ENERGY_AMOUNT`       | Cantidad de energía inválida |
| 12     | `INVALID_DURATION`            | Duración inválida |
| 20     | `TRANSACTION_NOT_FOUND`       | Transacción/suscripción no encontrada |
| 21     | `CANNOT_STOP_SUBSCRIPTION`    | No se puede detener la suscripción |
| 24     | `ADDRESS_NOT_ACTIVATED`       | Dirección no activada |
| 25     | `ADDRESS_ALREADY_ACTIVATED`   | Dirección ya activada |
| 30     | `AML_CHECK_NOT_FOUND`         | Chequeo AML no encontrado |
| 35     | `SERVICE_NOT_AVAILABLE`       | Servicio no disponible |
| 50     | `INVALID_BANDWIDTH_AMOUNT`    | Cantidad de ancho de banda inválida |
| 500    | `INTERNAL_SERVER_ERROR`       | Error interno del servidor — contacta a soporte |

## Desarrollo

```bash
# Instalar dependencias
npm ci

# Ejecutar pruebas
npm test

# Lintear código
npm run lint

# Las mismas pruebas en Bun y Deno, si están instalados
npm run test:bun
npm run test:deno
```

Las pruebas usan un servidor HTTP/TLS local y nunca llaman a la API real. `examples/basic-usage.ts` es una prueba de humo contra un entorno real (`npm run example`); las instrucciones están al inicio del archivo.

## Soporte

Para soporte, contáctanos en Telegram: [@tronzap_bot](https://t.me/tronzap_bot)

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
