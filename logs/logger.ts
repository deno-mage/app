const COLORS = {
  success: "\x1b[32m", // green
  info: "\x1b[94m", // blue
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
  reset: "\x1b[0m", // reset
  // pink
  plugin: "\x1b[35m", // pink
};

/**
 * Log messages with Mage's standard log format
 */
export class MageLogger {
  private _source: string;

  /**
   * Constructs a new MageLogger instance.
   *
   * @param source The source of the log messages such as a plugin name
   */
  constructor(source: string) {
    this._source = source;
  }

  /**
   * Logs a message with the "success" level.
   *
   * @param message The log message
   */
  public success(message: string) {
    console.log(this.format("success", message));
  }

  /**
   * Logs a message with the "info" level.
   *
   * @param message The log message
   */
  public info(message: string) {
    console.info(this.format("info", message));
  }

  /**
   * Logs a message with the "warn" level.
   *
   * @param message The log message
   */
  public warn(message: string) {
    console.warn(this.format("warn", message));
  }

  /**
   * Logs a message with the "error" level.
   *
   * @param message The log message
   */
  public error(message: string | Error) {
    console.error(this.format("error", message.toString()));
  }

  /**
   * Formats a log message.
   *
   * @param logLevel The log level
   * @param message The log message
   * @returns The formatted log message
   */
  private format(logLevel: keyof typeof COLORS, message: string) {
    const level = `${COLORS[logLevel]}[${
      logLevel.charAt(0).toUpperCase() + logLevel.slice(1)
    }]${COLORS.reset}`;
    const source = `${COLORS.plugin}[${this._source}]${COLORS.reset}`;

    return `${source}${level} ${message}`;
  }
}
