import type { ClientErrorStatus, ServerErrorStatus } from "../status/mod.ts";

/**
 * Error class for Mage errors, throw with a status code for it to be honored by Mage in the response.
 *
 * @param message The error message
 * @param status The HTTP status code for the error, this will be honored by Mage in the response
 * @param options Additional options for the error
 */
export class MageError extends Error {
  private _status: ClientErrorStatus | ServerErrorStatus = 500;

  /**
   * The HTTP status code for the error.
   */
  public get status(): ClientErrorStatus | ServerErrorStatus {
    return this._status;
  }

  /**
   * Construct a new MageError object
   *
   * @param message The error message
   * @param status The HTTP status code for the error, this will be honored by Mage in the response
   * @param options Additional options for the error
   */
  constructor(
    message: string,
    status?: ClientErrorStatus | ServerErrorStatus,
    options?: ErrorOptions,
  ) {
    super(message, options);

    this.name = "MageError";
    this._status = status ?? 500;
  }
}
