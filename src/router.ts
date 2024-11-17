import { MageContext } from "./context.ts";
import { HttpMethod } from "./http.ts";

export type MageMiddleware = (
  context: MageContext,
  next: () => Promise<void> | void,
) => Promise<void> | void;

interface MiddlewareRegisterEntry {
  methods?: string[];
  pathname?: string;
  middleware: MageMiddleware[];
}

class MiddlewareRegister {
  private pushedEntries: MiddlewareRegisterEntry[] = [];

  public push(entry: MiddlewareRegisterEntry) {
    this.pushedEntries.push(entry);
  }

  public match(context: MageContext): MageMiddleware[] {
    const matchedEntries = this.pushedEntries
      .filter((entry) => {
        if (entry.methods && !entry.methods.includes(context.request.method)) {
          return false;
        }

        if (entry.pathname && entry.pathname !== context.url.pathname) {
          return false;
        }

        if (entry.pathname) {
          context.matchedPathname = entry.pathname;
        }

        return true;
      })
      .flatMap((entry) => entry.middleware);

    return matchedEntries;
  }

  public getAvailableMethods(pathname: string): string[] {
    const methods = this.pushedEntries
      .filter((entry) => entry.pathname === pathname)
      .flatMap((entry) => entry.methods ?? []);

    return methods;
  }
}

export class MageRouter {
  private middlewareRegister = new MiddlewareRegister();

  public match(context: MageContext): MageMiddleware[] {
    return this.middlewareRegister.match(context);
  }

  public getAvailableMethods(pathname: string): string[] {
    return this.middlewareRegister.getAvailableMethods(pathname);
  }

  public use(...middleware: MageMiddleware[]) {
    this.middlewareRegister.push({
      middleware,
    });
  }

  public all(pathname: string, ...middleware: MageMiddleware[]) {
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
      pathname,
      middleware,
    });
  }

  public get(pathname: string, ...middleware: MageMiddleware[]): void {
    this.middlewareRegister.push({
      methods: [HttpMethod.Get, HttpMethod.Head],
      pathname,
      middleware,
    });
  }

  public post(pathname: string, ...middleware: MageMiddleware[]): void {
    this.middlewareRegister.push({
      methods: [HttpMethod.Post],
      pathname,
      middleware,
    });
  }

  public put(pathname: string, ...middleware: MageMiddleware[]): void {
    this.middlewareRegister.push({
      methods: [HttpMethod.Put],
      pathname,
      middleware,
    });
  }

  public delete(pathname: string, ...middleware: MageMiddleware[]): void {
    this.middlewareRegister.push({
      methods: [HttpMethod.Delete],
      pathname,
      middleware,
    });
  }

  public patch(pathname: string, ...middleware: MageMiddleware[]): void {
    this.middlewareRegister.push({
      methods: [HttpMethod.Patch],
      pathname,
      middleware,
    });
  }

  public options(pathname: string, ...middleware: MageMiddleware[]): void {
    this.middlewareRegister.push({
      methods: [HttpMethod.Options],
      pathname,
      middleware,
    });
  }

  public head(pathname: string, ...middleware: MageMiddleware[]): void {
    this.middlewareRegister.push({
      methods: [HttpMethod.Head],
      pathname,
      middleware,
    });
  }
}
