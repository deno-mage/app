import { memoize } from "@std/cache";
import { MageError } from "./error.ts";

type ValidationSource = "json" | "form" | "params" | "search-params";

/**
 * Arguments for the MageRequest class
 */
interface MageRequestArgs {
  /**
   * The wildcard path part matched by the router
   */
  wildcard?: string;
  /**
   * The URL parameters of the request matched by the router
   */
  params: { [key: string]: string };
}

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
  private _validationResults: Map<ValidationSource, unknown>;
  private _wildcard?: string;
  private _params: { [key: string]: string };

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
   * The wildcard path part matched by the router
   */
  public get wildcard(): string | undefined {
    return this._wildcard;
  }

  /**
   * The URL parameters of the request matched by the router
   */
  public get params(): { [key: string]: string } {
    return this._params;
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
   *
   * @param req The raw Request object
   * @param options Options for the request
   */
  public constructor(req: Request, options: MageRequestArgs) {
    this._raw = req;
    this._validationResults = new Map<
      ValidationSource,
      Map<unknown, unknown>
    >();
    this._wildcard = options.wildcard;
    this._params = options.params;

    this.arrayBuffer = memoize(this._raw.arrayBuffer.bind(req));
    this.blob = memoize(this._raw.blob.bind(req));
    this.formData = memoize(this._raw.formData.bind(req));
    this.json = memoize(this._raw.json.bind(req));
    this.text = memoize(this._raw.text.bind(req));
  }

  /**
   * Get the value of a header from the request
   *
   * @param name The name of the header
   */
  public header(name: string): string | null {
    return this.raw.headers.get(name);
  }

  /**
   * Get the value of a search parameter from the request
   *
   * @param name The name of the search parameter
   */
  public searchParam(name: string): string | null {
    return this.url.searchParams.get(name);
  }

  /**
   * Get a validation result, if it exists.
   *
   * @param source The source of the validation result
   */
  public valid<TResult>(source: ValidationSource): TResult {
    const result = this._validationResults.get(source);

    if (!result) {
      throw new MageError(`No validation result found for ${source}`);
    }

    return result as TResult;
  }

  /**
   * Set a validation result,
   *
   * @param source The source of the validation result
   * @param schema The schema to validate the result against
   * @param result The result of the validation
   */
  public setValidationResult<TResult>(
    source: ValidationSource,
    result: TResult,
  ) {
    this._validationResults.set(source, result);
  }
}
