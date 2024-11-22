export class MageError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MageError";
  }
}
