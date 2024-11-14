import { MageContext } from "./context.ts";
import { MageMiddlewareFunction } from "./middleware.ts";
import { compose } from "./compose.ts";
import { getAvailablePort } from "./ports.ts";

interface Middleware {
  method?: "get" | "post" | "put" | "delete" | "patch";
  path?: string;
  middlewareFunctions: MageMiddlewareFunction[];
}

export interface RunOptions {
  port: number;
}

export class MageApp {
  private middleware: Middleware[] = [];

  use(...middlewareFunctions: MageMiddlewareFunction[]): void {
    this.middleware.push({ middlewareFunctions });
  }

  get(path: string, ...middlewareFunctions: MageMiddlewareFunction[]): void {
    this.middleware.push({ method: "get", path, middlewareFunctions });
  }

  post(path: string, ...middlewareFunctions: MageMiddlewareFunction[]): void {
    this.middleware.push({ method: "post", path, middlewareFunctions });
  }

  put(path: string, ...middlewareFunctions: MageMiddlewareFunction[]): void {
    this.middleware.push({ method: "put", path, middlewareFunctions });
  }

  delete(path: string, ...middlewareFunctions: MageMiddlewareFunction[]): void {
    this.middleware.push({ method: "delete", path, middlewareFunctions });
  }

  patch(path: string, ...middlewareFunctions: MageMiddlewareFunction[]): void {
    this.middleware.push({ method: "patch", path, middlewareFunctions });
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
        .map((middleware) => middleware.middlewareFunctions)
        .flat();

      const composed = compose(handlers);

      await composed(context);

      if (!context.response) {
        throw new Error("Response not set");
      }

      return context.response;
    });
  }
}
