import { MageApp } from "../../exports.ts";

const TEST_PORT_FLOOR = 60000;

export class MageTestServer {
  public app: MageApp = new MageApp();
  private server: Deno.HttpServer<Deno.NetAddr> | undefined;

  start() {
    this.server = this.app.run({
      port: Math.floor(Math.random() * 1000) + TEST_PORT_FLOOR,
    });
  }

  url(path: string) {
    if (!this.server) {
      throw new Error("Unable to get URL, server is not running");
    }

    return new URL(
      path,
      `http://${this.server.addr.hostname}:${this.server.addr.port}`,
    );
  }

  async stop() {
    await this.server?.shutdown();
  }
}
