# TronZap SDK para Node.js

**[English](README.md)** | [Español](README.es.md) | [Português](README.pt-br.md) | [Русский](README.ru.md)

SDK oficial de Node.js para la API de TronZap.
Este SDK te permite integrar fácilmente los servicios de TronZap para el alquiler de energía TRON.

TronZap.com te permite [comprar energía TRON](https://tronzap.com/), haciendo que las transferencias de USDT (TRC20) sean más baratas al reducir significativamente las tarifas de transacción.

👉 [Regístrate para obtener una clave API](https://tronzap.com) para comenzar a usar la API de TronZap e integrarla a través del SDK.

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

- **Node.js**: v16.0.0 o superior
- **Bun**: v1.0.0 o superior
- **Deno**: v1.0.0 o superior

## Inicio Rápido

```typescript
import { TronZapClient } from 'tronzap-sdk';

// Inicializar el cliente
const client = new TronZapClient({
  apiToken: 'tu_api_token',
  apiSecret: 'tu_api_secret'
});

// Obtener servicios disponibles
const services = await client.getServices();
console.log(services);

// Obtener saldo de la cuenta
const balance = await client.getBalance();
console.log(balance);

// Calcular costo de energía
const calculation = await client.calculate(
  'DIRECCION_BILLETERA_TRON',
  65150  // Cantidad recomendada para transferencias USDT
);
console.log(calculation);

// Crear transacción de energía
const transaction = await client.createEnergyTransaction(
  'DIRECCION_BILLETERA_TRON',
  65150,
  1,
  'mi-tx-id',  // ID externo opcional
  true        // Opcional: activar dirección si es necesario
);
console.log(transaction);

// Verificar estado de la transacción
const status = await client.checkTransaction('ID_TRANSACCION');
console.log(status);

// Obtener información de recarga directa
const rechargeInfo = await client.getDirectRechargeInfo();
console.log(rechargeInfo);
```

## Características

- Soporte completo para TypeScript
- Compatibilidad multiplataforma (Node.js, Bun, Deno)
- Obtener servicios disponibles
- Obtener saldo de cuenta
- Calcular costo de energía
- Crear transacciones de activación de dirección
- Crear transacciones de compra de energía
- Verificar estado de transacciones
- Obtener información de recarga directa

## Requisitos

- Node.js v16.0.0 o superior, o
- Bun v1.0.0 o superior, o
- Deno v1.0.0 o superior

## Manejo de Errores

El SDK lanza `TronZapError` cuando la API devuelve un error. Cada error incluye una propiedad `.code` y `.message` para depuración y manejo de casos específicos.

### Ejemplo

```typescript
import { TronZapClient, TronZapError, ErrorCode } from 'tronzap-sdk';

const client = new TronZapClient({
  apiToken: 'tu_api_token',
  apiSecret: 'tu_api_secret'
});

try {
  const balance = await client.getBalance();
} catch (error) {
  if (error instanceof TronZapError) {
    switch (error.code) {
      case ErrorCode.AUTH_ERROR:
        console.error('Error de autenticación');
        break;
      case ErrorCode.INVALID_SERVICE_OR_PARAMS:
        console.error('Servicio o parámetros inválidos');
        break;
      case ErrorCode.WALLET_NOT_FOUND:
        console.error('Billetera interna no encontrada. Contacta a soporte.');
        break;
      case ErrorCode.INSUFFICIENT_FUNDS:
        console.error('Fondos insuficientes');
        break;
      case ErrorCode.INVALID_TRON_ADDRESS:
        console.error('Dirección TRON inválida');
        break;
      case ErrorCode.INVALID_ENERGY_AMOUNT:
        console.error('Cantidad de energía inválida');
        break;
      case ErrorCode.INVALID_DURATION:
        console.error('Duración inválida');
        break;
      case ErrorCode.TRANSACTION_NOT_FOUND:
        console.error('Transacción no encontrada');
        break;
      case ErrorCode.ADDRESS_NOT_ACTIVATED:
        console.error('Dirección no activada');
        break;
      case ErrorCode.ADDRESS_ALREADY_ACTIVATED:
        console.error('Dirección ya activada');
        break;
      case ErrorCode.INTERNAL_SERVER_ERROR:
        console.error('Error interno del servidor');
        break;
      default:
        console.error(`Error no manejado ${error.code}: ${error.message}`);
    }
  } else {
    console.error('Error inesperado:', error);
  }
}
```

### Códigos de Error

| Código | Constante                      | Descripción |
|--------|--------------------------------|-------------|
| 1      | `AUTH_ERROR`                  | Error de autenticación - Token API o firma inválidos |
| 2      | `INVALID_SERVICE_OR_PARAMS`   | Servicio o parámetros inválidos |
| 5      | `WALLET_NOT_FOUND`            | Billetera interna no encontrada. Contacta a soporte. |
| 6      | `INSUFFICIENT_FUNDS`          | Fondos insuficientes |
| 10     | `INVALID_TRON_ADDRESS`        | Dirección TRON inválida |
| 11     | `INVALID_ENERGY_AMOUNT`       | Cantidad de energía inválida |
| 12     | `INVALID_DURATION`            | Duración inválida |
| 20     | `TRANSACTION_NOT_FOUND`       | Transacción no encontrada |
| 24     | `ADDRESS_NOT_ACTIVATED`       | Dirección no activada |
| 25     | `ADDRESS_ALREADY_ACTIVATED`   | Dirección ya activada |
| 500    | `INTERNAL_SERVER_ERROR`       | Error interno del servidor - Contacta a soporte |

## Desarrollo

```bash
# Instalar dependencias
npm install

# Construir el SDK
npm run build

# Ejecutar pruebas
npm test

# Lintear código
npm run lint

# Formatear código
npm run format
```

## Soporte

Para soporte, contáctanos en Telegram: [@tronzap_bot](https://t.me/tronzap_bot)

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.