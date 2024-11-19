import type { MageContext } from "./context.ts";

/**
 * Options for setting a cookie
 */
export interface CookieOptions {
  /**
   * Max age in seconds, if set takes precedence over `expires`
   */
  maxAge?: number;
  /**
   * Datetime when the cookie expires
   */
  expires?: Date;
  /**
   * Only send the cookie to the specified path
   */
  path?: string;
  /**
   * Only send the cookie to the specified domain
   */
  domain?: string;
  /**
   * Only send the cookie over HTTPS
   */
  secure?: boolean;
  /**
   * Only include the cookie in HTTP requests
   */
  httpOnly?: boolean;
  /**
   * Controls when the cookie is sent with cross-origin requests
   */
  sameSite?: "Strict" | "Lax" | "None";
}

/**
 * Interact with cookies in the request and response
 */
export class Cookies {
  private _context: MageContext;

  public constructor(context: MageContext) {
    this._context = context;
  }

  /**
   * Create cookie string to put in the `Set-Cookie` header
   *
   * @param name
   * @param value
   * @param options
   */
  public setCookie(name: string, value: string, options: CookieOptions = {}) {
    let cookie = `${name}=${value};`;

    if (options.maxAge) {
      cookie += ` Max-Age=${options.maxAge};`;
    }

    if (options.expires) {
      cookie += ` Expires=${options.expires.toUTCString()};`;
    }

    if (options.path) {
      cookie += ` Path=${options.path};`;
    }

    if (options.domain) {
      cookie += ` Domain=${options.domain};`;
    }

    if (options.secure) {
      cookie += ` Secure;`;
    }

    if (options.httpOnly) {
      cookie += ` HttpOnly;`;
    }

    if (options.sameSite) {
      cookie += ` SameSite=${options.sameSite};`;
    }

    this._context.response.headers.append("Set-Cookie", cookie);
  }

  /**
   * Remove cookie from the client
   */
  public deleteCookie(name: string) {
    this._context.response.headers.append("Set-Cookie", `${name}=; Max-Age=0`);
  }

  /**
   * Get the cookie value from the request
   *
   * @param name
   */
  public get(name: string): string | null {
    const cookies = this._context.request.headers.get("Cookie");

    if (!cookies) {
      return null;
    }

    const cookie = cookies
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${name}=`));

    if (!cookie) {
      return null;
    }

    return cookie.split("=")[1];
  }
}
