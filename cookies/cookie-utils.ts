import type { MageContext } from "../app/mod.ts";

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
 * Set cookie on response
 *
 * @param context MageContext
 * @param name Name of the cookie
 * @param value Value of the cookie
 * @param options Options for the cookie
 */
export const setCookie = (
  c: MageContext,
  name: string,
  value: string,
  options: CookieOptions = {},
): void => {
  const parts = [`${name}=${value}`];

  if (options.maxAge) {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  if (options.expires) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }

  if (options.path) {
    parts.push(`Path=${options.path}`);
  }

  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }

  if (options.secure) {
    parts.push(`Secure`);
  }

  if (options.httpOnly) {
    parts.push(`HttpOnly`);
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  const cookie = parts.join("; ");

  c.res.headers.append("Set-Cookie", cookie);
};

/**
 * Remove cookie from the response
 *
 * @param context MageContext
 * @param name Name of the cookie
 */
export const deleteCookie = (c: MageContext, name: string): void => {
  c.res.headers.append("Set-Cookie", `${name}=; Max-Age=0`);
};

/**
 * Get the cookie value from the request
 *
 * @param context MageContext
 * @param name Name of the cookie
 * @returns The value of the cookie or null if not found
 */
export const getCookie = (c: MageContext, name: string): string | null => {
  const cookies = c.req.header("Cookie");

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
};
