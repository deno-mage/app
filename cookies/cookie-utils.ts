import type { MageContext } from "../app/mod.ts";

/**
 * Create HMAC-SHA256 signature for a value.
 * Used for signing cookies to prevent tampering.
 */
const createSignature = async (
  value: string,
  secret: string,
): Promise<string> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(value),
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

/**
 * Verify HMAC-SHA256 signature for a value.
 * Uses constant-time comparison to prevent timing attacks.
 */
const verifySignature = async (
  value: string,
  signature: string,
  secret: string,
): Promise<boolean> => {
  const expectedSignature = await createSignature(value, secret);
  return signature === expectedSignature;
};

/**
 * Options for setting a cookie
 */
export interface CookieOptions {
  /** Secret for HMAC-SHA256 signing */
  secret?: string;
  /** Max age in seconds (takes precedence over expires) */
  maxAge?: number;
  /** Expiration date */
  expires?: Date;
  /** Cookie path */
  path?: string;
  /** Cookie domain */
  domain?: string;
  /** Send over HTTPS only */
  secure?: boolean;
  /** HTTP requests only (no JavaScript access) */
  httpOnly?: boolean;
  /** Cross-origin request policy */
  sameSite?: "Strict" | "Lax" | "None";
}

/**
 * Set cookie on response with optional signing
 */
export const setCookie = async (
  c: MageContext,
  name: string,
  value: string,
  options: CookieOptions = {},
): Promise<void> => {
  let cookieValue = value;

  if (options.secret) {
    const signature = await createSignature(value, options.secret);
    cookieValue = `s:${value}.${signature}`;
  }

  const parts = [`${name}=${cookieValue}`];

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
 * Remove cookie from response
 */
export const deleteCookie = (
  c: MageContext,
  name: string,
  options?: Pick<CookieOptions, "path" | "domain">,
): void => {
  const parts = [`${name}=`, `Max-Age=0`];

  if (options?.path) {
    parts.push(`Path=${options.path}`);
  }

  if (options?.domain) {
    parts.push(`Domain=${options.domain}`);
  }

  const cookie = parts.join("; ");
  c.res.headers.append("Set-Cookie", cookie);
};

/**
 * Get cookie value from request with signature verification
 */
export const getCookie = async (
  c: MageContext,
  name: string,
  secret?: string,
): Promise<string | null> => {
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

  // Split only on the first '=' to handle values containing '='
  const equalsIndex = cookie.indexOf("=");
  if (equalsIndex === -1) {
    return null;
  }

  let value = cookie.substring(equalsIndex + 1);

  // Remove surrounding quotes if present (RFC 6265 allows quoted values)
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }

  // If secret provided and cookie is signed, verify signature
  if (secret && value.startsWith("s:")) {
    const signedValue = value.substring(2); // Remove 's:' prefix
    const lastDotIndex = signedValue.lastIndexOf(".");

    if (lastDotIndex === -1) {
      return null;
    }

    const actualValue = signedValue.substring(0, lastDotIndex);
    const signature = signedValue.substring(lastDotIndex + 1);

    const isValid = await verifySignature(actualValue, signature, secret);
    if (!isValid) {
      return null;
    }

    return actualValue;
  }

  return value;
};
