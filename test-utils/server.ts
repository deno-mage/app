import { MageApp } from "../app/mod.ts";

const TEST_PORT_FLOOR = 60000;

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
        port: port ?? Math.floor(Math.random() * 1000) + TEST_PORT_FLOOR,
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
    await this._server?.shutdown();
  }
}
