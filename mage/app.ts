import { MageContext } from "./mage-context.ts";
import { MageHandler } from "./mage-handler.ts";
import { compose } from "./utlis/compose.ts";
import { getAvailablePort } from "./utlis/get-available-port.ts";

interface Middleware {
  method?: "get" | "post" | "put" | "delete" | "patch";
  path?: string;
  handlers: MageHandler[];
}

export interface RunOptions {
  port: number;
}

export class MageApp {
  private middleware: Middleware[] = [];

  use(...handlers: MageHandler[]): void {
    this.middleware.push({ handlers });
  }

  get(path: string, ...handlers: MageHandler[]): void {
    this.middleware.push({ method: "get", path, handlers });
  }

  post(path: string, ...handlers: MageHandler[]): void {
    this.middleware.push({ method: "post", path, handlers });
  }

  put(path: string, ...handlers: MageHandler[]): void {
    this.middleware.push({ method: "put", path, handlers });
  }

  delete(path: string, ...handlers: MageHandler[]): void {
    this.middleware.push({ method: "delete", path, handlers });
  }

  patch(path: string, ...handlers: MageHandler[]): void {
    this.middleware.push({ method: "patch", path, handlers });
  }

  run(options: RunOptions) {
    const serveOptions = {
      port: getAvailablePort(options.port),
    };

    Deno.serve(serveOptions, async (_req) => {
      const url = URL.parse(_req.url);
      if (!url) {
        throw new Error("Invalid URL");
      }

      console.log(url);

      const context: MageContext = new MageContext(_req);

      const middlewares = this.middleware.filter((middleware) => {
        if (
          middleware.method &&
          middleware.method !== _req.method.toLowerCase()
        ) {
          return false;
        }

        if (middleware.path && middleware.path !== url.pathname) {
          return false;
        }

        return true;
      });

      const handlers = middlewares
        .map((middleware) => middleware.handlers)
        .flat();

      const composed = compose(handlers);

      await composed(context);

      if (!context.response) {
        return new Response("Not Found", { status: 404 });
      }

      return context.response;
    });
  }
}
