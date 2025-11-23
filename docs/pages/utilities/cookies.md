---
title: "Cookies"
description: "Set, get, and delete HTTP cookies with optional signing"
layout: article
---

# Cookies

Utilities for setting, getting, and deleting HTTP cookies with optional
HMAC-SHA256 signing to prevent tampering.

## Quick Start

```typescript
import { MageApp } from "@mage/app";
import { deleteCookie, getCookie, setCookie } from "@mage/cookies";

const app = new MageApp();

app.get("/set", async (c) => {
  await setCookie(c, "session", "abc123", {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  });
  return c.text("Cookie set");
});

app.get("/get", async (c) => {
  const session = await getCookie(c, "session");
  return c.text(session ?? "No cookie");
});

app.get("/delete", (c) => {
  deleteCookie(c, "session");
  return c.text("Cookie deleted");
});

Deno.serve(app.handler);
```

## API

### setCookie()

Set a cookie on the response.

```typescript
await setCookie(c: MageContext, name: string, value: string, options?: CookieOptions)
```

**Options:**

| Option     | Type                          | Default | Description                               |
| ---------- | ----------------------------- | ------- | ----------------------------------------- |
| `secret`   | `string`                      | -       | Secret for HMAC-SHA256 signing            |
| `maxAge`   | `number`                      | -       | Cookie lifetime in seconds                |
| `expires`  | `Date`                        | -       | Expiration date (maxAge takes precedence) |
| `path`     | `string`                      | -       | Cookie path                               |
| `domain`   | `string`                      | -       | Cookie domain                             |
| `secure`   | `boolean`                     | -       | Send over HTTPS only                      |
| `httpOnly` | `boolean`                     | -       | Prevent JavaScript access                 |
| `sameSite` | `"Strict" \| "Lax" \| "None"` | -       | Cross-site request policy                 |

### getCookie()

Get a cookie value from the request.

```typescript
await getCookie(c: MageContext, name: string, secret?: string): Promise<string | null>
```

Returns the cookie value or `null` if not found. If `secret` is provided,
verifies the signature and returns `null` if invalid.

### deleteCookie()

Delete a cookie by setting Max-Age=0.

```typescript
deleteCookie(c: MageContext, name: string, options?: { path?: string; domain?: string })
```

To delete a cookie, you must match the `path` and `domain` used when setting it.

## Signed Cookies

Use signed cookies to prevent tampering. The signature is created with
HMAC-SHA256.

```typescript
import { MageApp } from "@mage/app";
import { getCookie, setCookie } from "@mage/cookies";

const SECRET = Deno.env.get("COOKIE_SECRET")!;

const app = new MageApp();

// Set signed cookie
app.post("/login", async (c) => {
  await setCookie(c, "session", "user123", {
    secret: SECRET,
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  });
  return c.json({ success: true });
});

// Get signed cookie
app.get("/profile", async (c) => {
  const session = await getCookie(c, "session", SECRET);

  if (!session) {
    return c.text("Unauthorized", 401);
  }

  return c.json({ userId: session });
});

Deno.serve(app.handler);
```

## Examples

### Session Cookie

```typescript
app.post("/login", async (c) => {
  await setCookie(c, "session", generateSessionId(), {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 3600, // 1 hour
  });
  return c.redirect("/dashboard");
});
```

### Persistent Cookie

```typescript
app.post("/remember-me", async (c) => {
  await setCookie(c, "remember", "true", {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  });
  return c.json({ remembered: true });
});
```

### Delete Cookie with Path

```typescript
app.post("/logout", (c) => {
  // Must match path used when setting
  deleteCookie(c, "session", { path: "/" });
  return c.redirect("/");
});
```

## Security Considerations

**Always use these settings for sensitive cookies:**

- `httpOnly: true` - Prevents XSS attacks from stealing cookies
- `secure: true` - Only send over HTTPS (prevents MITM)
- `sameSite: "Lax"` or `"Strict"` - Prevents CSRF attacks

**Signed cookies:**

- Use a strong secret (minimum 32 random bytes)
- Rotate secrets regularly
- Store secrets in environment variables, never in code
- Invalid signatures return `null` (don't reveal why)

**Cookie scope:**

- Limit `domain` to your domain (default is current domain)
- Set specific `path` when needed (default is all paths)
- Use `Strict` for authentication, `Lax` for most cases, `None` requires
  `Secure`

See
[MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
and
[OWASP: Session Management](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/06-Session_Management_Testing/01-Testing_for_Session_Management_Schema)
for fundamentals.

## Notes

- Cookie signing uses HMAC-SHA256
- Signed cookies are prefixed with `s:` and include signature:
  `s:value.signature`
- Invalid signatures return `null` (fail silently)
- Deleting a cookie requires matching the original `path` and `domain`
- All functions are async due to signing operations
- Handles quoted values, equals signs in values, and multiple cookies

## Related

- [MageContext](/core/mage-context) - Context object passed to handlers
- [Request & Response](/core/request-response) - HTTP request and response
  handling
