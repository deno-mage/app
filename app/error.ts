import type { ClientErrorStatus, ServerErrorStatus } from "../status/mod.ts";

/**
 * Error class for Mage applications.
 * Thrown errors with status codes will be honored in the HTTP response.
 */
export class MageError extends Error {
  private _status: ClientErrorStatus | ServerErrorStatus = 500;

  public get status(): ClientErrorStatus | ServerErrorStatus {
    return this._status;
  }

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
