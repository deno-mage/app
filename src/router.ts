import { MageContext } from "./context.ts";
import { HttpMethod } from "./http.ts";

/**
 * Middleware function signature for Mage applications.
 */
export type MageMiddleware = (
  /**
   * The context for the current request.
   */
  context: MageContext,
  /**
   * The next middleware function in the chain. Don't call this if you want to
   * stop the chain and return a response.
   */
  next: () => Promise<void> | void,
) => Promise<void> | void;

/**
 * MiddlewareRegisterEntry is an entry in the MiddlewareRegister.
 */
interface MiddlewareRegisterEntry {
  /**
   * The methods that this middleware should run for. If not provided, the
   * middleware will run for all methods.
   */
  methods?: string[];
  /**
   * The routename that this middleware should run for. If not provided, the
   * middleware will run for all routes.
   */
  routename?: string;
  /**
   * The middleware to run.
   */
  middleware: MageMiddleware[];
}

/**
 * MiddlewareRegister is a class for registering middleware for a Mage
 * application and matching middleware to a given context.
 */
class MiddlewareRegister {
  private entries: MiddlewareRegisterEntry[] = [];

  /**
   * Pushes a new entry into the register.
   *
   * @param entry
   */
  public push(entry: MiddlewareRegisterEntry) {
    this.entries.push(entry);
  }
  /**
   * Match middleware for a given context.
   *
   * @param context
   * @returns
   */
  public match(context: MageContext): MageMiddleware[] {
    const matchedEntries = this.entries
      .filter((entry) => {
        if (entry.methods && !entry.methods.includes(context.request.method)) {
          return false;
        }

        if (entry.routename && entry.routename !== context.url.pathname) {
          return false;
        }

        if (entry.routename) {
          context.matchedRoutename = entry.routename;
        }

        return true;
      })
      .flatMap((entry) => entry.middleware);

    return matchedEntries;
  }

  /**
   * Get available methods for a given pathname.
   *
   * @param pathname
   * @returns
   */
  public getAvailableMethods(pathname: string): string[] {
    const methods = this.entries
      .filter((entry) => entry.routename === pathname)
      .flatMap((entry) => entry.methods ?? []);

    return methods;
  }
}

/**
 * MageRouter is a class for defining routes and middleware for a Mage
 * application.
 */
export class MageRouter {
  private middlewareRegister = new MiddlewareRegister();

  /**
   * Match middleware for a given context.
   *
   * @param context
   * @returns
   */
  public match(context: MageContext): MageMiddleware[] {
    return this.middlewareRegister.match(context);
  }

  /**
   * Get available methods for a given pathname.
   *
   * @param pathname
   * @returns
   */
  public getAvailableMethods(pathname: string): string[] {
    return this.middlewareRegister.getAvailableMethods(pathname);
  }

  /**
   * Adds middleware to the router that will be run for every request.
   *
   * @param middleware
   */
  public use(...middleware: MageMiddleware[]) {
    this.middlewareRegister.push({
      middleware,
    });
  }

  /**
   * Adds middleware to the application that will be run for every request
   * for the specified route.
   *
   * @param routename
   * @param middleware
   */
  public all(routename: string, ...middleware: MageMiddleware[]) {
    this.middlewareRegister.push({
      methods: [
        HttpMethod.Get,
        HttpMethod.Post,
        HttpMethod.Put,
        HttpMethod.Delete,
        HttpMethod.Patch,
        HttpMethod.Options,
        HttpMethod.Head,
      ],
      routename,
      middleware,
    });
  }

  /**
   * Adds middleware to the application that will be run for GET requests
   * for the specified route.
   *
   * @param routename
   * @param middleware
   */
  public get(routename: string, ...middleware: MageMiddleware[]): void {
    this.middlewareRegister.push({
      methods: [HttpMethod.Get, HttpMethod.Head],
      routename,
      middleware,
    });
  }

  /**
   * Adds middleware to the application that will be run for POST requests
   * for the specified route.
   *
   * @param routename
   * @param middleware
   */
  public post(routename: string, ...middleware: MageMiddleware[]): void {
    this.middlewareRegister.push({
      methods: [HttpMethod.Post],
      routename,
      middleware,
    });
  }

  /**
   * Adds middleware to the application that will be run for PUT requests
   * for the specified route.
   *
   * @param routename
   * @param middleware
   */
  public put(routename: string, ...middleware: MageMiddleware[]): void {
    this.middlewareRegister.push({
      methods: [HttpMethod.Put],
      routename,
      middleware,
    });
  }

  /**
   * Adds middleware to the application that will be run for DELETE requests
   * for the specified route.
   *
   * @param routename
   * @param middleware
   */
  public delete(routename: string, ...middleware: MageMiddleware[]): void {
    this.middlewareRegister.push({
      methods: [HttpMethod.Delete],
      routename,
      middleware,
    });
  }

  /**
   * Adds middleware to the application that will be run for PATCH requests
   * for the specified route.
   *
   * @param routename
   * @param middleware
   */
  public patch(routename: string, ...middleware: MageMiddleware[]): void {
    this.middlewareRegister.push({
      methods: [HttpMethod.Patch],
      routename,
      middleware,
    });
  }

  /**
   * Adds middleware to the application that will be run for OPTIONS requests
   * for the specified route.
   *
   * @param routename
   * @param middleware
   */
  public options(routename: string, ...middleware: MageMiddleware[]): void {
    this.middlewareRegister.push({
      methods: [HttpMethod.Options],
      routename,
      middleware,
    });
  }

  /**
   * Adds middleware to the application that will be run for HEAD requests
   * for the specified route.
   *
   * @param routename
   * @param middleware
   */
  public head(routename: string, ...middleware: MageMiddleware[]): void {
    this.middlewareRegister.push({
      methods: [HttpMethod.Head],
      routename,
      middleware,
    });
  }
}
