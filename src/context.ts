import type React from "../.npm/react.ts";
import { renderToReadableStream } from "../.npm/react-dom/server.ts";
import { RedirectType, StatusCode, statusTextMap } from "./http.ts";
import type { MageRouter } from "./router.ts";

/**
 * Serializable JSON value
 */
type JSONValues = string | number | boolean | null | JSONValues[];

/**
 * Serializable JSON object
 */
type JSON = { [key: string]: JSONValues } | JSONValues[];

/**
 * Context object that is passed to each middleware. It persists throughout the
 * request/response cycle and is used to interact with the request and response.
 */
export class MageContext {
  /**
   * The URL of the request
   */
  public url: URL;

  /**
   * The response object that will be sent at the end of the request/response
   * cycle.
   */
  public response: Response = new Response();

  public constructor(public request: Request, private router: MageRouter) {
    this.url = new URL(request.url);
  }

  /**
   * Sends a text response with the provided status code and body
   * @param status
   * @param body
   */
  public text(status: StatusCode, body: string) {
    this.response = new Response(body, {
      status: status,
      statusText: statusTextMap[status],
      headers: this.response.headers,
    });

    this.response.headers.set("Content-Type", "text/plain; charset=utf-8");
  }

  /**
   * Sends a JSON response with the provided status code and body
   * @param status
   * @param body
   */
  public json(status: StatusCode, body: JSON) {
    this.response = new Response(JSON.stringify(body), {
      status: status,
      statusText: statusTextMap[status],
      headers: this.response.headers,
    });

    this.response.headers.set("Content-Type", "application/json");
  }

  /**
   * Renders a JSX element to the response body with the provided status code
   * @param status
   * @param body
   */
  public async render(status: StatusCode, body: React.ReactNode) {
    this.response = new Response(await renderToReadableStream(body), {
      status: status,
      statusText: statusTextMap[status],
      headers: this.response.headers,
    });

    this.response.headers.set("Content-Type", "text/html; charset=utf-8");
  }

  /**
   * Sends an empty response with the provided status code
   * @param status
   */
  public empty(status: StatusCode) {
    this.response = new Response(null, {
      status: status,
      statusText: statusTextMap[status],
      headers: this.response.headers,
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

    this.response = new Response(null, {
      status,
      statusText: statusTextMap[status],
      headers: this.response.headers,
    });

    this.response.headers.set("Location", location.toString());
  }
}
