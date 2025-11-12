# cookies

Utilities for cookie management with optional HMAC-SHA256 signing.

## Installation

```typescript
import { deleteCookie, getCookie, setCookie } from "@mage/app/cookies";
```

## Usage

```typescript
app.post("/login", async (c) => {
  await setCookie(c, "sessionId", "abc123", {
    secret: "my-secret-key",
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 3600,
  });
  c.text("Logged in");
});

app.get("/profile", async (c) => {
  const sessionId = await getCookie(c, "sessionId", "my-secret-key");
  if (!sessionId) {
    c.text("Unauthorized", 401);
    return;
  }
  c.text(`Session: ${sessionId}`);
});
```

## API

**`setCookie(c, name, value, options?)`**

**`getCookie(c, name, secret?)`** - Returns `string | null`

**`deleteCookie(c, name, options?)`**

## Options

| Option     | Type                          | Description                   |
| ---------- | ----------------------------- | ----------------------------- |
| `secret`   | `string`                      | Sign cookies with HMAC-SHA256 |
| `maxAge`   | `number`                      | Max age in seconds            |
| `expires`  | `Date`                        | Expiration date               |
| `path`     | `string`                      | Cookie path                   |
| `domain`   | `string`                      | Cookie domain                 |
| `secure`   | `boolean`                     | HTTPS only                    |
| `httpOnly` | `boolean`                     | No JavaScript access          |
| `sameSite` | `"Strict" \| "Lax" \| "None"` | Cross-site behavior           |

## Notes

- When `secret` is provided, cookies are signed and verified automatically
- Signature verification returns `null` for tampered cookies
- `maxAge` takes precedence over `expires`
