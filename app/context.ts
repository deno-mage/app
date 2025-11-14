import { serveFile } from "@std/http";
import type { MageRequest } from "./mod.ts";
import {
  type ContentfulStatus,
  type ContentlessStatus,
  type RedirectStatus,
  statusText,
} from "../status/mod.ts";

/**
 * Arguments for the MageContext class
 */
interface MageContextArgs {
  req: MageRequest;
}

/**
 * Context object that is passed to each middleware. It persists throughout the
 * request/response cycle and is used to interact with the request and response.
 */
export class MageContext {
  private _res: Response;
  private _req: MageRequest;
  private _data: Map<string, unknown>;

  public get res(): Response {
    return this._res;
  }

  public set res(res: Response) {
    this._res = res;
  }

  public get req(): MageRequest {
    return this._req;
  }

  public constructor(args: MageContextArgs) {
    this._req = args.req;
    this._res = new Response();
    this._data = new Map<string, unknown>();
  }

  /** Set a response header */
  public header(key: string, value: string) {
    this._res.headers.set(key, value);
  }

  /** Send a text response */
  public text(body: string, status?: ContentfulStatus) {
    this._res = new Response(body, {
      status,
      headers: this._res.headers,
    });

    this.header("Content-Type", "text/plain; charset=UTF-8");
  }

  /** Send a JSON response */
  public json(
    body: { [key: string]: unknown } | readonly unknown[],
    status?: ContentfulStatus,
  ) {
    this._res = new Response(JSON.stringify(body), {
      status,
      headers: this._res.headers,
    });

    this.header(
      "Content-Type",
      "application/json; charset=UTF-8",
    );
  }

  /** Send an HTML response */
  public html(body: string, status?: ContentfulStatus) {
    this.text(body, status);

    this.header("Content-Type", "text/html; charset=UTF-8");
  }

  /** Send an empty response with optional status code (defaults to 204) */
  public empty(status?: ContentlessStatus) {
    this._res = new Response(null, {
      status: status ?? 204,
      headers: this._res.headers,
    });
  }

  /** Send a 404 Not Found response */
  public notFound(text?: string) {
    this.text(text ?? statusText(404), 404);
  }

  /** Send a 403 Forbidden response */
  public forbidden(text?: string) {
    this.text(text ?? statusText(403), 403);
  }

  /**
   * Redirect to the provided location (defaults to 307 Temporary Redirect).
   */
  public redirect(location: URL | string, status?: RedirectStatus) {
    this._res = new Response(null, {
      status: status ?? 307,
      headers: this._res.headers,
    });

    this.header("Location", location.toString());
  }

  /**
   * Rewrite the request to a different location by making a new fetch.
   * Useful for proxying requests to another server.
   *
   * NOTE: Not optimal for local rewrites as it creates a network request.
   */
  public async rewrite(location: URL | string) {
    let url: URL;

    // Handle relative path (starts with /)
    if (typeof location === "string" && location.startsWith("/")) {
      // Preserve query string from original request
      url = new URL(location, this._req.url.origin);
      url.search = this._req.url.search;
    } else {
      // Handle absolute URL (string or URL object)
      url = typeof location === "string" ? new URL(location) : location;

      // If the target URL doesn't have a query string, preserve the original
      if (!url.search && this._req.url.search) {
        url.search = this._req.url.search;
      }
    }

    this._res = await fetch(url, {
      method: this._req.method,
      headers: this._req.raw.headers,
      body: this._req.raw.body,
    });
  }

  /** Serve a static file from the filesystem */
  public async file(filepath: string) {
    const fileInfo = await Deno.stat(filepath);

    // Deno's`serveFile()` will set the response headers, so we need to save the current
    // headers before calling it to preserve any headers that were set before
    const currentHeader = this._res.headers;

    this._res = await serveFile(this._req.raw, filepath, { fileInfo });

    // Preserve the headers that were set before calling `serveFile` but only if
    // they are not already set in the response
    for (const [key, value] of currentHeader.entries()) {
      if (!this._res.headers.has(key)) {
        this.header(key, value);
      }
    }
  }

  /**
   * Upgrade to WebSocket connection.
   * Sends 501 Not Implemented if the request is not a WebSocket upgrade request.
   */
  public webSocket(handleSocket: (socket: WebSocket) => void) {
    if (this.req.header("upgrade") !== "websocket") {
      this.text("Not Implemented", 501);
      return;
    }

    const { socket, response } = Deno.upgradeWebSocket(this._req.raw);

    this._res = response;

    handleSocket(socket);
  }

  /** Get data stored in context via `set()` method */
  public get<TData = unknown>(key: string): TData {
    return this._data.get(key) as TData;
  }

  /** Store data in context for the duration of the request */
  public set(key: string, value: unknown) {
    this._data.set(key, value);
  }
}
