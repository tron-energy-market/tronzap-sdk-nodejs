# Changelog

All notable changes to this project are documented in this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versions 1.1.0 to 1.4.0 were tagged on GitHub but never published to npm, where the previous version is 1.0.4.
Upgrading from 1.0.4 to 1.5.0 brings their changes as well.

## [Unreleased]

### Added

- `timeout` option of `TronZapClient`, in milliseconds, 30000 by default. It covers the whole request, including
  reading the response. Requests used to wait for the API indefinitely.
- Every method takes request options as its last argument: `signal`, an `AbortSignal` that cancels the call and
  rejects it with the signal's reason, and `timeout`, which overrides the client's one.
- `fetch` option of `TronZapClient`, to send requests through another `fetch`, e.g. one with a proxy or other
  certificate authorities. The global `fetch` is looked up on every request, so mocks installed after the client was
  created apply.
- `InvalidRequestError`, thrown before any request is sent when a required argument is empty, such as an address,
  both `id` and `externalId` of `checkTransaction`, or the type, network or address of an AML check, and when the
  parameters cannot be encoded as JSON. It extends `TronZapError` and has code 0.
- `requestId` and `statusCode` on `ApiError`.
- `VERSION` export.
- The tests run on Node.js, Bun and Deno.

### Changed

- Node.js 20 or newer is required. Node.js 18 is no longer supported.
- `calculate` sends the energy amount as the API's `amount` field instead of the deprecated `energy` field. The
  argument is still called `energy`.
- `estimateEnergy` leaves `contract_address` out of the request when it is empty, so the API estimates a USDT
  (TRC20) transfer.
- A `duration`, `page` or `perPage` below 1 is sent as 1, 1 and 10. Empty optional arguments such as `externalId`,
  `hash`, `direction` and `status` are left out of the request.
- `checkTransaction` without an id throws `InvalidRequestError` instead of `ApiError` with code 2.
- The constructor throws `InvalidRequestError`, which is still an `Error`, when the token or the secret is missing,
  and when the timeout is not a positive number.
- Network errors are classified by the error codes of Node.js and Bun and the messages of Deno, so more of them are
  reported as `ConnectionError`, `TimeoutError` or `SslError` instead of `NetworkError`.
- A trailing `/` of the base URL is ignored.
- The build is no longer minified, so stack traces point at readable code.
- The package contains only the build, the READMEs, the changelog and the license.

### Fixed

- A successful response whose `result` is missing, `null`, a string or a number was returned as the result. It now
  throws `ServerError`.
- An API error whose `code` is not an integer, or a response that is valid JSON but not an object, used `undefined`
  or the raw value as the error code. It is now `ApiError` with code 1. Fields of the wrong type no longer end up in
  the error message and key.

## [1.4.0] - 2026-05-05

### Added

- `createResourceBundleTransaction` buys energy and bandwidth in one transaction.
- Error codes `CANNOT_STOP_SUBSCRIPTION` (21), `SERVICE_NOT_AVAILABLE` (35) and `INVALID_BANDWIDTH_AMOUNT` (50).

### Changed

- Energy transactions send the amount as `params.amounts.energy`.

## [1.3.0] - 2026-03-31

### Added

- `getAddressInfo` returns the resources and balances of an address.

## [1.2.1] - 2026-03-04

### Fixed

- API errors in responses with a non-2xx HTTP status are thrown as `ApiError` instead of an HTTP error.

## [1.2.0] - 2026-03-02

### Added

- `ApiError` with `errorKey`, the machine-readable error alias.
- A typed error hierarchy for network, TLS, timeout, rate limit, authorization and server errors. All of them extend
  `TronZapError`.

### Fixed

- A response that is not JSON, or a failed connection, threw a `SyntaxError` or a `TypeError` instead of an SDK error.

## [1.1.0] - 2025-12-11

### Added

- AML checks: `getAmlServices`, `createAmlCheck`, `checkAmlStatus` and `getAmlHistory`.
- `createBandwidthTransaction`.
