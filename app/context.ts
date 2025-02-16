import { serveFile } from "@std/http";
import type { MageRequest } from "./mage-request.ts";
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
  /**
   * The request object
   */
  req: MageRequest;
  /**
   * The unique identifier for the build
   */
  buildId: string;
}

/**
 * Context object that is passed to each middleware. It persists throughout the
 * request/response cycle and is used to interact with the request and response.
 */
export class MageContext {
  private _buildId: string;
  private _res: Response;
  private _req: MageRequest;
  private _data: Map<string, unknown>;

  /**
   * The unique identifier for the build
   */
  public get buildId(): string {
    return this._buildId;
  }

  /**
   * The current response
   */
  public get res(): Response {
    return this._res;
  }

  /**
   * The current response
   */
  public set res(res: Response) {
    this._res = res;
  }

  /**
   * The current request
   */
  public get req(): MageRequest {
    return this._req;
  }

  /**
   * Construct a new MageContext object
   *
   * @param args The arguments for the MageContext class
   */
  public constructor(args: MageContextArgs) {
    this._buildId = args.buildId;
    this._req = args.req;
    this._res = new Response();
    this._data = new Map<string, unknown>();
  }

  /**
   * Set a response header
   */
  public header(key: string, value: string) {
    this._res.headers.set(key, value);
  }

  /**
   * Sends a text response with the provided status code and body
   *
   * @param body The body of the response
   * @param status The status code of the response
   */
  public text(body: string, status?: ContentfulStatus) {
    this._res = new Response(body, {
      status,
      headers: this._res.headers,
    });

    this.header("Content-Type", "text/plain; charset=UTF-8");
  }

  /**
   * Sends a JSON response with the provided status code and body
   *
   * @param body The body of the response
   * @param status The status code of the response
   */
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

  /**
   * Sends HTML response with the provided status code and body
   */
  public html(body: string, status?: ContentfulStatus) {
    this.text(body, status);

    this.header("Content-Type", "text/html; charset=UTF-8");
  }

  /**
   * Sends an empty response with the provided status code
   *
   * @param status The status code of the response
   */
  public empty(status?: ContentlessStatus) {
    this._res = new Response(null, {
      status: status ?? 204,
      headers: this._res.headers,
    });
  }

  /**
   * Send a not found response
   */
  public notFound() {
    this.text(statusText(404), 404);
  }

  /**
   * Redirects the request to the provided location with the specified redirect.
   * Default to 307 temporary redirect.
   *
   * @param location The location to redirect to
   * @param status The status code of the response
   */
  public redirect(location: URL | string, status?: RedirectStatus) {
    this._res = new Response(null, {
      status: status ?? 307,
      headers: this._res.headers,
    });

    this.header("Location", location.toString());
  }

  /**
   * Rewrites the request to the provided location
   *
   * NOTE: This is not optimal for local rewrites, as it will make a new request
   * to the provided location. This is useful for proxying requests to another
   * server.
   *
   * @param location The location to rewrite to
   */
  public async rewrite(location: URL | string) {
    let url: URL;

    if (location.toString().startsWith("/")) {
      url = new URL(
        `${location.toString()}${this._req.url.search}`,
        this._req.url.origin,
      );
    } else {
      const pathname = new URL(location).pathname;
      url = new URL(`${pathname}${this._req.url.search}`, location);
    }

    this._res = await fetch(url, {
      method: this._req.method,
      headers: this._req.raw.headers,
      body: this._req.raw.body,
    });
  }

  /**
   * Serve a file.
   *
   * @param file
   */
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
   * Establish a WebSocket connection. If the request is not a WebSocket request
   * it will send a 501 Not Implemented response and no WebSocket will be created.
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

  /**
   * Get data stored via `set()` method
   *
   * @param key The key of the data to get
   */
  public get<TData = unknown>(key: string): TData {
    return this._data.get(key) as TData;
  }

  /**
   * Set data to be stored in the context for the duraction of the request
   *
   * @param key The key of the data to set
   * @param value The value of the data to set
   */
  public set(key: string, value: unknown) {
    this._data.set(key, value);
  }
}
