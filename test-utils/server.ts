import { MageApp } from "../app/mod.ts";

/**
 * A test server for running Mage apps in a test environment
 */
export class MageTestServer {
  private _app: MageApp = new MageApp();
  private _server: Deno.HttpServer<Deno.NetAddr> | undefined;

  /**
   * The test server's app instance
   */
  public get app() {
    return this._app;
  }

  start(port?: number) {
    this._server = Deno.serve(
      {
        // Use port 0 to let the OS assign a free port (prevents "address in use" errors)
        // Only use the provided port if explicitly specified
        port: port ?? 0,
      },
      this._app.handler,
    );
  }

  url(path: string) {
    return new URL(
      path,
      `http://${this._server?.addr.hostname}:${this._server?.addr.port}`,
    );
  }

  wsUrl(path: string) {
    return new URL(
      path,
      `ws://${this._server?.addr.hostname}:${this._server?.addr.port}`,
    );
  }

  async stop() {
    if (this._server) {
      await this._server.shutdown();
      await this._server.finished;
    }
  }
}
