import { memoize } from "@std/cache";
import { MageError } from "./error.ts";

type ValidationSource = "json" | "form" | "params" | "search-params";

/**
 * Arguments for the MageRequest class
 */
interface MageRequestArgs {
  /** Wildcard path part matched by the router */
  wildcard?: string;
  /** URL parameters matched by the router */
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

  public get raw(): Request {
    return this._raw;
  }

  public get url(): URL {
    return new URL(this._raw.url);
  }

  public get method(): string {
    return this._raw.method;
  }

  public get wildcard(): string | undefined {
    return this._wildcard;
  }

  public get params(): { [key: string]: string } {
    return this._params;
  }

  /** Memoized access to request body as ArrayBuffer */
  public arrayBuffer: () => Promise<ArrayBuffer>;

  /** Memoized access to request body as Blob */
  public blob: () => Promise<Blob>;

  /** Memoized access to request body as FormData */
  public formData: () => Promise<FormData>;

  /** Memoized access to request body as JSON */
  public json: () => Promise<unknown>;

  /** Memoized access to request body as text */
  public text: () => Promise<string>;

  public constructor(req: Request, options: MageRequestArgs) {
    this._raw = req;
    this._validationResults = new Map<ValidationSource, unknown>();
    this._wildcard = options.wildcard;
    this._params = options.params;

    this.arrayBuffer = memoize(this._raw.arrayBuffer.bind(req));
    this.blob = memoize(this._raw.blob.bind(req));
    this.formData = memoize(this._raw.formData.bind(req));
    this.json = memoize(this._raw.json.bind(req));
    this.text = memoize(this._raw.text.bind(req));
  }

  /** Get a request header value */
  public header(name: string): string | null {
    return this.raw.headers.get(name);
  }

  /** Get a URL search parameter value */
  public searchParam(name: string): string | null {
    return this.url.searchParams.get(name);
  }

  /**
   * Get validated data from a validation middleware.
   *
   * @throws MageError if no validation result exists for the source
   */
  public valid<TResult>(source: ValidationSource): TResult {
    const result = this._validationResults.get(source);

    if (!result) {
      throw new MageError(`No validation result found for ${source}`);
    }

    return result as TResult;
  }

  /** Store validation result for later retrieval via `valid()` method */
  public setValidationResult<TResult>(
    source: ValidationSource,
    result: TResult,
  ) {
    this._validationResults.set(source, result);
  }
}
