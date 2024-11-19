import type { VNode } from "preact";
import { renderToStringAsync } from "preact-render-to-string";
import { RedirectType, StatusCode, statusTextMap } from "./http.ts";

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
  private _url: URL;
  private _response: Response = new Response();
  private _request: Request;

  /**
   * The URL of the request
   */
  public get url(): URL {
    return this._url;
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

  public constructor(request: Request) {
    this._url = new URL(request.url);
    this._request = request;
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
  public json(status: StatusCode, body: JSON) {
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
}
