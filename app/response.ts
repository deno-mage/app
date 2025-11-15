/**
 * MageResponse wraps response state to enable lazy materialization.
 *
 * Instead of creating multiple Response objects throughout the middleware chain,
 * MageResponse stores the intent (body, status, headers) and materializes the
 * final Response object only once when finalize() is called.
 *
 * Benefits:
 * - Single Response object per request (eliminates churn)
 * - Direct body access for middleware (no streaming overhead)
 * - Mutable headers throughout middleware chain
 * - Support for external Responses (file serving, rewrite, WebSocket)
 */
export class MageResponse {
  // Internal state - stores response intent
  private _body: BodyInit | null = null;
  private _status: number = 200;
  private _statusText: string = "";
  private _headers = new Headers();

  // External Response (for file(), rewrite(), webSocket())
  private _externalResponse: Response | null = null;

  /**
   * Get the response body.
   * Returns external Response body if set, otherwise internal body state.
   */
  public get body(): BodyInit | null {
    return this._externalResponse?.body ?? this._body;
  }

  /**
   * Get the response status code.
   * Returns external Response status if set, otherwise internal status state.
   */
  public get status(): number {
    return this._externalResponse?.status ?? this._status;
  }

  /**
   * Get the response status text.
   * Returns external Response statusText if set, otherwise internal statusText state.
   */
  public get statusText(): string {
    return this._externalResponse?.statusText ?? this._statusText;
  }

  /**
   * Get the response headers.
   * Always returns the internal mutable Headers object, even when external Response is set.
   * This allows middleware to modify headers before finalization.
   */
  public get headers(): Headers {
    return this._headers;
  }

  /**
   * Set the response body.
   * Clears any external Response when called.
   */
  public setBody(body: BodyInit | null): void {
    this._externalResponse = null;
    this._body = body;
  }

  /**
   * Set the response status code and optional status text.
   */
  public setStatus(status: number, statusText?: string): void {
    this._status = status;
    this._statusText = statusText ?? "";
  }

  /**
   * Set an external Response (for file(), rewrite(), webSocket()).
   *
   * External Response headers are merged into internal headers, with
   * user-set headers taking precedence. This allows middleware to set
   * headers before calling file() and have them preserved.
   *
   * @param response External Response object
   */
  public setExternal(response: Response): void {
    this._externalResponse = response;

    // Merge external Response headers into our mutable headers
    // Only add headers that haven't been set by user/middleware
    response.headers.forEach((value, key) => {
      if (!this._headers.has(key)) {
        this._headers.set(key, value);
      }
    });
  }

  /**
   * Check if a response body has been set.
   * Used by middleware like CORS to detect empty responses.
   */
  public hasBody(): boolean {
    return this._body !== null || this._externalResponse !== null;
  }

  /**
   * Finalize the response by materializing a Response object.
   *
   * This should only be called once by MageApp after the middleware chain completes.
   * Creates a single Response object from the internal state or external Response.
   *
   * @returns Final Response object ready to be returned to client
   */
  public finalize(): Response {
    if (this._externalResponse) {
      // WebSocket upgrade responses (status 101) must be returned as-is
      // They cannot be cloned or recreated from their body
      if (this._externalResponse.status === 101) {
        return this._externalResponse;
      }

      // Return external Response with our merged headers
      // Need to create new Response to apply modified headers
      return new Response(this._externalResponse.body, {
        status: this._externalResponse.status,
        statusText: this._externalResponse.statusText,
        headers: this._headers,
      });
    }

    // Materialize from internal state
    return new Response(this._body, {
      status: this._status,
      statusText: this._statusText,
      headers: this._headers,
    });
  }
}
