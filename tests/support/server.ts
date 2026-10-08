import { createHash } from 'node:crypto';
import http, {
  type IncomingHttpHeaders,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import https from 'node:https';
import type { AddressInfo } from 'node:net';
import type { TestCertificate } from './certificate';

export const API_TOKEN = 'test-token';
export const API_SECRET = 'test-secret';

export class ReceivedRequest {
  constructor(
    readonly method: string,
    readonly path: string,
    readonly headers: IncomingHttpHeaders,
    readonly raw: Buffer
  ) {}

  get body(): string {
    return this.raw.toString('utf8');
  }

  json(): unknown {
    return JSON.parse(this.body);
  }

  expectedSignature(secret = API_SECRET): string {
    return createHash('sha256').update(this.raw).update(secret).digest('hex');
  }
}

interface Reply {
  status: number;
  body: string;
  delayMs: number;
  bodyDelayMs: number;
}

export class ApiServer {
  readonly requests: ReceivedRequest[] = [];
  private reply: Reply = ApiServer.success({});

  private constructor(
    private readonly server: http.Server,
    readonly url: string
  ) {}

  static async http(): Promise<ApiServer> {
    return ApiServer.start(http.createServer(), 'http', 'localhost');
  }

  static async https(certificate: TestCertificate, host = 'localhost'): Promise<ApiServer> {
    const server = https.createServer({ key: certificate.key, cert: certificate.cert });
    return ApiServer.start(server, 'https', host);
  }

  private static async start(
    server: http.Server,
    scheme: string,
    host: string
  ): Promise<ApiServer> {
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    const api = new ApiServer(server, `${scheme}://${host}:${String(port)}`);
    server.on('request', (request: IncomingMessage, response: ServerResponse) => {
      api.handle(request, response);
    });
    return api;
  }

  private static success(result: unknown): Reply {
    return { status: 200, body: JSON.stringify({ code: 0, result }), delayMs: 0, bodyDelayMs: 0 };
  }

  ok(result: unknown): void {
    this.reply = ApiServer.success(result);
  }

  respond(
    status: number,
    body: unknown,
    options: { delayMs?: number; bodyDelayMs?: number } = {}
  ): void {
    this.reply = {
      status,
      body: typeof body === 'string' ? body : JSON.stringify(body),
      delayMs: options.delayMs ?? 0,
      bodyDelayMs: options.bodyDelayMs ?? 0,
    };
  }

  last(): ReceivedRequest {
    const request = this.requests.at(-1);
    if (request === undefined) {
      throw new Error('The server received no request');
    }
    return request;
  }

  reset(): void {
    this.requests.length = 0;
    this.reply = ApiServer.success({});
  }

  async close(): Promise<void> {
    this.server.closeAllConnections();
    await new Promise<void>(resolve =>
      this.server.close(() => {
        resolve();
      })
    );
  }

  private handle(request: IncomingMessage, response: ServerResponse): void {
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    request.on('end', () => {
      this.requests.push(
        new ReceivedRequest(
          request.method ?? '',
          request.url ?? '',
          request.headers,
          Buffer.concat(chunks)
        )
      );
      const { status, body, delayMs, bodyDelayMs } = this.reply;
      setTimeout(() => {
        response.writeHead(status, { 'Content-Type': 'application/json' });
        if (bodyDelayMs === 0) {
          response.end(body);
          return;
        }
        response.write(body.slice(0, 1));
        setTimeout(() => {
          response.end(body.slice(1));
        }, bodyDelayMs);
      }, delayMs);
    });
  }
}

export async function closedPort(): Promise<number> {
  const server = http.createServer();
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  await new Promise<void>(resolve =>
    server.close(() => {
      resolve();
    })
  );
  return port;
}
