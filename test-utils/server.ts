import { MageApp } from "../mod.ts";

const TEST_PORT_FLOOR = 60000;

export class MageTestServer {
  public app: MageApp = new MageApp();
  private server: Deno.HttpServer<Deno.NetAddr> | undefined;

  start(port?: number) {
    this.server = this.app.run({
      port: port ?? Math.floor(Math.random() * 1000) + TEST_PORT_FLOOR,
    });
  }

  url(path: string) {
    return new URL(
      path,
      `http://${this.server?.addr.hostname}:${this.server?.addr.port}`,
    );
  }

  async stop() {
    await this.server?.shutdown();
  }
}
