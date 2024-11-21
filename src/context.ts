import type { VNode } from "preact";
import { renderToStringAsync } from "preact-render-to-string";
import { serveFile } from "@std/http";
import { RedirectType, StatusCode, statusTextMap } from "./http.ts";
import { Cookies } from "./cookies.ts";
import type { CookieOptions } from "./cookies.ts";

/**
 * Context object that is passed to each middleware. It persists throughout the
 * request/response cycle and is used to interact with the request and response.
 */
export class MageContext {
  private _url: URL;
  private _response: Response;
  private _request: Request;
  private _cookies: Cookies;
  private _params: { [key: string]: string };
  private _wildcard?: string;

  /**
   * The URL of the request
   */
  public get url(): URL {
    return this._url;
  }

  /**
   * The URL parameters of the request matched by the router
   */
  public get params(): { [key: string]: string } {
    return this._params;
  }

  /**
   * The response object that will be sent at the end of the request/response
   * cycle.
   */
  public get response(): Response {
    return this._response;
  }

  /**
   * The request object for the current request
   */
  public get request(): Request {
    return this._request;
  }

  public get wildcard(): string | undefined {
    return this._wildcard;
  }

  public constructor(
    request: Request,
    url: URL,
    params: { [key: string]: string },
    wildcard?: string,
  ) {
    this._request = request;
    this._url = url;
    this._params = params;
    this._response = new Response();
    this._cookies = new Cookies(this);
    this._wildcard = wildcard;
  }

  /**
   * Sends a text response with the provided status code and body
   * @param status
   * @param body
   */
  public text(status: StatusCode, body: string) {
    this._response = new Response(body, {
      status: status,
      statusText: statusTextMap[status],
      headers: this._response.headers,
    });

    this._response.headers.set("Content-Type", "text/plain; charset=utf-8");
  }

  /**
   * Sends a JSON response with the provided status code and body
   * @param status
   * @param body
   */
  public json(status: StatusCode, body: { [key: string]: unknown }) {
    this._response = new Response(JSON.stringify(body), {
      status: status,
      statusText: statusTextMap[status],
      headers: this._response.headers,
    });

    this._response.headers.set("Content-Type", "application/json");
  }

  /**
   * Renders a JSX element to the response body with the provided status code
   * @param status
   * @param body
   */
  public async render(status: StatusCode, body: VNode) {
    const html = await renderToStringAsync(body);
    this._response = new Response(`<!DOCTYPE html>${html}`, {
      status: status,
      statusText: statusTextMap[status],
      headers: this._response.headers,
    });

    this._response.headers.set("Content-Type", "text/html; charset=utf-8");
  }

  /**
   * Sends an empty response with the provided status code
   * @param status
   */
  public empty(status: StatusCode) {
    this._response = new Response(null, {
      status: status,
      statusText: statusTextMap[status],
      headers: this._response.headers,
    });
  }

  /**
   * Redirects the request to the provided location with the specified redirect
   * @param redirectType
   * @param location
   */
  public redirect(redirectType: RedirectType, location: URL | string) {
    const status = redirectType === RedirectType.Permanent
      ? StatusCode.PermanentRedirect
      : StatusCode.TemporaryRedirect;

    this._response = new Response(null, {
      status,
      statusText: statusTextMap[status],
      headers: this._response.headers,
    });

    this._response.headers.set("Location", location.toString());
  }

  /**
   * Rewrites the request to the provided location
   *
   * NOTE: This is not optimal for local rewrites, as it will make a new request
   * to the provided location. This is useful for proxying requests to another
   * server.
   *
   * @param location
   */
  public async rewrite(location: URL | string) {
    const url = location.toString();

    if (url.startsWith("/")) {
      this._url.pathname = url;
    } else {
      const pathname = new URL(url).pathname;
      this._url = new URL(`${pathname}${this._url.search}`, url);
    }

    this._response = await fetch(this._url, {
      method: this._request.method,
      headers: this._request.headers,
      body: this._request.body,
    });
  }

  /**
   * Create cookie string to put in the `Set-Cookie` header
   *
   * @param name
   * @param value
   * @param options
   */
  public setCookie(name: string, value: string, options: CookieOptions = {}) {
    this._cookies.setCookie(name, value, options);
  }

  /**
   * Remove cookie from the client
   */
  public deleteCookie(name: string) {
    this._cookies.deleteCookie(name);
  }

  /**
   * Get the cookie value from the request
   *
   * @param name
   */
  public getCookie(name: string): string | null {
    return this._cookies.get(name);
  }

  /**
   * Serve a file.
   *
   * @param file
   * @param fileInfo
   */
  public async serveFile(filepath: string, fileInfo?: Deno.FileInfo) {
    // `serveFile` will set the response headers, so we need to save the current
    // headers before calling it to preserve any headers that were set before
    const currentHeader = this._response.headers;

    this._response = await serveFile(this._request, filepath, { fileInfo });

    // Preserve the headers that were set before calling `serveFile` but only if
    // they are not already set in the response
    for (const [key, value] of currentHeader.entries()) {
      if (!this._response.headers.has(key)) {
        this._response.headers.set(key, value);
      }
    }
  }
}
