import { MageContext } from "./context.ts";
import { compose } from "./compose.ts";
import { getAvailablePort } from "./ports.ts";
import { MageRouter, MageMiddleware } from "./router.ts";

interface RunOptions {
  port: number;
}

export class MageApp {
  private router = new MageRouter();

  public use(...middleware: MageMiddleware[]): void {
    this.router.use(...middleware);
  }

  public all(pathname: string, ...middleware: MageMiddleware[]): void {
    this.router.all(pathname, ...middleware);
  }

  public get(pathname: string, ...middleware: MageMiddleware[]): void {
    this.router.get(pathname, ...middleware);
  }

  public post(pathname: string, ...middleware: MageMiddleware[]): void {
    this.router.post(pathname, ...middleware);
  }

  public put(pathname: string, ...middleware: MageMiddleware[]): void {
    this.router.put(pathname, ...middleware);
  }

  public delete(pathname: string, ...middleware: MageMiddleware[]): void {
    this.router.delete(pathname, ...middleware);
  }

  public patch(pathname: string, ...middleware: MageMiddleware[]): void {
    this.router.patch(pathname, ...middleware);
  }

  public options(pathname: string, ...middleware: MageMiddleware[]): void {
    this.router.options(pathname, ...middleware);
  }

  public head(pathname: string, ...middleware: MageMiddleware[]): void {
    this.router.head(pathname, ...middleware);
  }

  public run(options: RunOptions) {
    const serveOptions = {
      port: getAvailablePort(options.port),
    };

    return Deno.serve(serveOptions, async (_req) => {
      const url = new URL(_req.url);

      const context: MageContext = new MageContext(_req, url);

      const middleware = this.router.match(_req.method, url.pathname, context);

      await compose(middleware)(context);

      if (!context.response) {
        throw new Error("Response not set");
      }

      return context.response;
    });
  }
}
