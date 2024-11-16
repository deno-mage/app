import { MageContext } from "./context.ts";
import { HttpMethod } from "./http.ts";
import { useOptions } from "./middleware/options.ts";

export type MageMiddleware = (
  context: MageContext,
  next: () => Promise<void> | void
) => Promise<void> | void;

interface MiddlewareRegisterEntry {
  methods?: string[];
  pathname?: string;
  middleware: MageMiddleware[];
}

class MiddlewareRegister {
  private pushedEntries: MiddlewareRegisterEntry[] = [];
  private defaultEntries: MiddlewareRegisterEntry[] = [];

  public push(entry: MiddlewareRegisterEntry) {
    this.pushedEntries.push(entry);
    this.defaultEntries = [
      {
        middleware: [
          useOptions(
            this.pushedEntries
              .filter((entry) => entry.methods?.length && entry.pathname)
              .map((entry) => ({
                methods: entry.methods!,
                pathname: entry.pathname!,
              }))
          ),
        ],
      },
    ];
  }

  public match(method: string, path: string): MageMiddleware[] {
    const matchedEntries = [...this.pushedEntries, ...this.defaultEntries]
      .filter((entry) => {
        if (entry.methods && !entry.methods.includes(method)) {
          return false;
        }

        if (entry.pathname && entry.pathname !== path) {
          return false;
        }

        return true;
      })
      .flatMap((entry) => entry.middleware);

    return matchedEntries;
  }
}

export class MageRouter {
  private middlewareRegister = new MiddlewareRegister();

  public match(method: string, path: string): MageMiddleware[] {
    return this.middlewareRegister.match(method, path);
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
