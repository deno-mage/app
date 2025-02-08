import { memoize } from "@std/cache";

/**
 * Wrapper around the Request object that provides memoized access to the body.
 *
 * This is useful because the body of a request can only be read once. If you
 * read the body of a request, and then try to read it again, you will get an
 * error. This class memoizes the body of the request so that you can read it
 * multiple times by middleware.
 */
export class MageRequest {
  private _raw: Request;

  /**
   * The raw Request object
   */
  public get raw(): Request {
    return this._raw;
  }

  /**
   * The URL of the request
   */
  public get url(): URL {
    return new URL(this._raw.url);
  }

  /**
   * The method and URL of the request
   */
  public get method(): string {
    return this._raw.method;
  }

  /**
   * Memoized access to the body of the request
   */
  public arrayBuffer: () => Promise<ArrayBuffer>;

  /**
   * Memoized access to the body of the request
   */
  public blob: () => Promise<Blob>;

  /**
   * Memoized access to the body of the request
   */
  public formData: () => Promise<FormData>;

  /**
   * Memoized access to the body of the request
   */
  public json: () => Promise<unknown>;

  /**
   * Memoized access to the body of the request
   */
  public text: () => Promise<string>;

  /**
   * Constructor for MageRequest
   * @param request
   */
  public constructor(request: Request) {
    this._raw = request;

    this.arrayBuffer = memoize(request.arrayBuffer);
    this.blob = memoize(request.blob);
    this.formData = memoize(request.formData);
    this.json = memoize(request.json);
    this.text = memoize(request.text);
  }

  /**
   * Get the value of a header from the request
   */
  public header(name: string): string | null {
    return this.raw.headers.get(name);
  }

  /**
   * Get the value of a search parameter from the request
   */
  public searchParam(name: string): string | null {
    return this.url.searchParams.get(name);
  }
}
