import { MageContext } from "./context.ts";
import { compose } from "./compose.ts";
import { getAvailablePort } from "./ports.ts";
import { MageMiddleware, MageRouter } from "./router.ts";

/**
 * Options for running a Mage application
 */
interface RunOptions {
  /**
   * The port to run the application on. If this port is not available, the
   * application will attempt to run on the next available port until one is
   * found.
   */
  port: number;
}

/**
 * MageApp is the main class for creating and running Mage applications.
 */
export class MageApp {
  private router = new MageRouter();

  /**
   * Adds middleware to the application that will be run for every request.
   *
   * @param middleware
   */
  public use(...middleware: MageMiddleware[]): void {
    this.router.use(...middleware);
  }

  /**
   * Adds middleware to the application that will be run for every method
   * for the specified route.
   *
   * @param routename
   * @param middleware
   */
  public all(routename: string, ...middleware: MageMiddleware[]): void {
    this.router.all(routename, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for GET requests
   * for the specified route.
   *
   * @param routename
   * @param middleware
   */
  public get(routename: string, ...middleware: MageMiddleware[]): void {
    this.router.get(routename, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for POST requests
   * for the specified route.
   *
   * @param routename
   * @param middleware
   */
  public post(routename: string, ...middleware: MageMiddleware[]): void {
    this.router.post(routename, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for PUT requests
   * for the specified route.
   *
   * @param routename
   * @param middleware
   */
  public put(routename: string, ...middleware: MageMiddleware[]): void {
    this.router.put(routename, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for DELETE requests
   * for the specified route.
   *
   * @param routename
   * @param middleware
   */
  public delete(routename: string, ...middleware: MageMiddleware[]): void {
    this.router.delete(routename, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for PATCH requests
   * for the specified route.
   *
   * @param routename
   * @param middleware
   */
  public patch(routename: string, ...middleware: MageMiddleware[]): void {
    this.router.patch(routename, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for OPTIONS requests
   * for the specified route.
   *
   * @param routename
   * @param middleware
   */
  public options(routename: string, ...middleware: MageMiddleware[]): void {
    this.router.options(routename, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for HEAD requests
   * for the specified route.
   *
   * @param routename
   * @param middleware
   */
  public head(routename: string, ...middleware: MageMiddleware[]): void {
    this.router.head(routename, ...middleware);
  }

  /**
   * Runs the Mage application.
   *
   * @param options
   * @returns
   */
  public run(options: RunOptions) {
    const serveOptions = {
      port: getAvailablePort(options.port),
    };

    return Deno.serve(serveOptions, async (_req) => {
      const context: MageContext = new MageContext(_req, this.router);

      const middleware = this.router.match(context);

      await compose(middleware)(context);

      return context.response;
    });
  }
}
