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

  constructor(source: string) {
    this._source = source;
  }

  /** Log success message */
  public success(message: string) {
    console.log(this.format("success", message));
  }

  /** Log info message */
  public info(message: string) {
    console.info(this.format("info", message));
  }

  /** Log warning message */
  public warn(message: string) {
    console.warn(this.format("warn", message));
  }

  /** Log error message */
  public error(message: string | Error) {
    console.error(this.format("error", message.toString()));
  }

  /**
   * Log ephemeral message that overwrites the previous line.
   * Useful for status updates that change frequently (e.g., render notifications).
   */
  public ephemeral(message: string) {
    // \r returns to start of line, \x1b[K clears from cursor to end of line
    const output = "\r\x1b[K" + this.format("info", message);
    Deno.stdout.writeSync(new TextEncoder().encode(output));
  }

  private format(logLevel: keyof typeof COLORS, message: string) {
    const level = `${COLORS[logLevel]}[${
      logLevel.charAt(0).toUpperCase() + logLevel.slice(1)
    }]${COLORS.reset}`;
    const source = `${COLORS.plugin}[${this._source}]${COLORS.reset}`;

    return `${source}${level} ${message}`;
  }
}
