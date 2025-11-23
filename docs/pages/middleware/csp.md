---
title: "CSP"
description: "Set Content Security Policy headers to prevent injection attacks"
---

# CSP

The CSP middleware adds Content Security Policy headers to your responses,
protecting users from injection attacks like Cross-Site Scripting (XSS). CSP
works by restricting where resources can be loaded from, what scripts can
execute, and how inline content is handled.

## Quick Start

```typescript
import { MageApp } from "@mage/app";
import { csp } from "@mage/csp";

const app = new MageApp();

// Simple CSP with defaults
app.use(csp());

app.get("/", (c) => c.text("Hello!"));

Deno.serve(app.handler);
```

The above example applies reasonable default CSP directives that protect against
common attacks while remaining permissive enough for most applications.

## How It Works

Sets `Content-Security-Policy` header to restrict resource loading, block unsafe
inline content, and define trusted sources. Supports static directives (computed
at startup) or dynamic directives (per-request, for nonce-based policies).

See [MDN: CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) for
fundamentals.

## Options

| Option       | Type                                                   | Description                                                                                               |
| ------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `directives` | `CSPDirectives \| ((c: MageContext) => CSPDirectives)` | CSP directives (static object or function for nonce-based policies). Supports all CSP Level 2 directives. |

**Common directives**: `defaultSrc`, `scriptSrc`, `styleSrc`, `imgSrc`,
`fontSrc`, `connectSrc`, `formAction`, `frameAncestors`, `baseUri`, `objectSrc`,
`upgradeInsecureRequests`

See
[MDN: CSP Directives](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy#directives)
for full directive reference.

## Examples

### Basic Configuration

Apply the default CSP policy to all requests:

```typescript
import { MageApp } from "@mage/app";
import { csp } from "@mage/csp";

const app = new MageApp();

app.use(csp());

app.get("/", (c) => c.text("Hello!"));
```

### Custom Directives

Override defaults with your own policy:

```typescript
import { MageApp } from "@mage/app";
import { csp } from "@mage/csp";

const app = new MageApp();

app.use(
  csp({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.example.com"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "https://api.example.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    },
  }),
);

app.get("/", (c) => c.text("Hello!"));
```

### Nonce-Based Policies (Dynamic)

For applications using inline scripts, use nonces to allow specific inline
content:

```typescript
import { MageApp } from "@mage/app";
import { csp } from "@mage/csp";

const app = new MageApp();

app.use(
  csp({
    directives: (c) => {
      // Generate a unique nonce for this request
      const nonce = crypto
        .getRandomValues(new Uint8Array(16))
        .reduce((acc, byte) => acc + byte.toString(16).padStart(2, "0"), "");

      // Store it on context for use in templates
      c.set("nonce", nonce);

      return {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", `'nonce-${nonce}'`],
        styleSrc: ["'self'", `'nonce-${nonce}'`],
      };
    },
  }),
);

app.get("/", (c) => {
  const nonce = c.get<string>("nonce");
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <style nonce="${nonce}">
          body { font-family: sans-serif; }
        </style>
      </head>
      <body>
        <h1>Hello!</h1>
        <script nonce="${nonce}">
          console.log("This inline script is allowed");
        </script>
      </body>
    </html>
  `);
});

Deno.serve(app.handler);
```

### Strict Policy

Apply a stricter policy for maximum security:

```typescript
app.use(
  csp({
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: true,
    },
  }),
);
```

### Report Violations

Configure CSP to report violations to a server endpoint:

```typescript
app.use(
  csp({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      reportTo: ["csp-endpoint"],
    },
  }),
);

// Add a header to define where violations are reported
app.use((c, next) => {
  c.header(
    "Report-To",
    JSON.stringify({
      group: "csp-endpoint",
      max_age: 10886400,
      endpoints: [{ url: "https://your-domain.com/csp-report" }],
    }),
  );
  return next();
});
```

## Security Considerations

**Protects against**: XSS, data exfiltration, clickjacking, plugin-based attacks

**Doesn't protect**: CSRF (use CSRF middleware), SQL injection, same-site XSS,
HTTPS downgrade (use HSTS)

**Best practices**:

- Start strict (`'none'`), add sources only when needed
- Use nonces for inline scripts (not `'unsafe-inline'`)
- Avoid `'unsafe-inline'` and `'unsafe-eval'`
- Test with `Content-Security-Policy-Report-Only` first
- Monitor violations with `reportTo`

## Notes

- Custom directives merge with defaults (override specific ones as needed)
- Static directives = zero overhead; dynamic = minimal (<1ms per request)
- Regenerate nonces per request (don't reuse)
- Quote values like `'self'`, `'none'`; don't quote domains

## Related

- [Middleware System](/core/middleware) - How middleware works in Mage
- [Request/Response](/core/request-response) - Accessing headers in handlers
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) -
  Complete CSP reference
- [MDN: CSP Directives](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy#directives) -
  All available directives
