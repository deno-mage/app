import { MageContext } from "./context.ts";
import { MageMiddlewareFunction, Middleware } from "./middleware.ts";
import { compose } from "./compose.ts";
import { getAvailablePort } from "./ports.ts";
import { handleOptionsRequests } from "./middleware/handle-options-requests.ts";

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

    return Deno.serve(serveOptions, async (_req) => {
      const url = URL.parse(_req.url);
      if (!url) {
        throw new Error("Invalid URL");
      }

      const context: MageContext = new MageContext(_req);

      const matchingMiddleware = this.middleware.filter((middleware) => {
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

      const handlers = matchingMiddleware
        .map((middleware) => middleware.middlewareFunctions)
        .flat();

      if (_req.method === "OPTIONS") {
        handlers.push(handleOptionsRequests(url, this.middleware));
      }

      const composed = compose(handlers);

      await composed(context);

      if (!context.response) {
        throw new Error("Response not set");
      }

      return context.response;
    });
  }
}
