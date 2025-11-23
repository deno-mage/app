---
title: "Security Headers"
description: "Set common security headers to protect against attacks"
---

# Security Headers

The Security Headers middleware adds HTTP security headers to your responses,
protecting users from a wide range of attacks including clickjacking,
MIME-sniffing, and cross-origin attacks. It includes sensible defaults that work
for most applications while remaining fully customizable.

## Quick Start

```typescript
import { MageApp } from "@mage/app";
import { securityHeaders } from "@mage/security-headers";

const app = new MageApp();

// Add security headers with defaults
app.use(...securityHeaders());

app.get("/", (c) => c.text("Hello!"));

Deno.serve(app.handler);
```

The middleware returns an array of middlewares (note the `...` spread operator).
It includes the CSP middleware automatically and sets 10+ security headers with
safe defaults.

## How It Works

Sets multiple HTTP security headers to instruct browsers on content handling.
Includes CSP, cross-origin policies, HSTS, referrer policy, feature permissions,
and legacy X-\* headers. See
[OWASP: Security Headers](https://owasp.org/www-project-secure-headers/) for
details.

## Options

| Option                          | Type                       | Default                                 | Description                                                       |
| ------------------------------- | -------------------------- | --------------------------------------- | ----------------------------------------------------------------- |
| `csp`                           | `CSPOptions`               | Defaults provided                       | Content-Security-Policy options (see CSP middleware)              |
| `referrerPolicy`                | `string`                   | `"no-referrer"`                         | Controls referrer info (`"no-referrer"`, `"strict-origin"`, etc.) |
| `strictTransportSecurity`       | `string`                   | `"max-age=15552000; includeSubDomains"` | HSTS header to enforce HTTPS                                      |
| `xFrameOptions`                 | `"DENY" \| "SAMEORIGIN"`   | `"SAMEORIGIN"`                          | Prevent clickjacking via frame embedding                          |
| `xContentTypeOptions`           | `boolean`                  | `true`                                  | Prevent MIME-sniffing                                             |
| `xDnsPrefetchControl`           | `boolean`                  | `false`                                 | Control DNS prefetching                                           |
| `xDownloadOptions`              | `boolean`                  | `true`                                  | Prevent IE downloads in site context                              |
| `xPermittedCrossDomainPolicies` | `string`                   | `"none"`                                | Cross-domain document loading                                     |
| `xXssProtection`                | `string`                   | `"0"`                                   | Legacy XSS protection (disable recommended)                       |
| `crossOriginOpenerPolicy`       | `string`                   | `"same-origin"`                         | Window opener context isolation                                   |
| `crossOriginResourcePolicy`     | `string`                   | `"same-origin"`                         | Cross-origin resource sharing                                     |
| `originAgentCluster`            | `boolean`                  | `true`                                  | Prevent cross-origin document context sharing                     |
| `removeXPoweredBy`              | `boolean`                  | `true`                                  | Remove X-Powered-By header                                        |
| `permissionsPolicy`             | `Record<string, string[]>` | —                                       | Browser feature permissions (e.g., `{ geolocation: ["self"] }`)   |

## Examples

### Default Configuration

Apply the default security headers which cover most common attacks:

```typescript
import { MageApp } from "@mage/app";
import { securityHeaders } from "@mage/security-headers";

const app = new MageApp();

app.use(...securityHeaders());

app.get("/api/data", (c) => c.json({ message: "secure" }));
```

This sets all headers with safe defaults. You get protection against:

- Clickjacking (X-Frame-Options)
- MIME-sniffing (X-Content-Type-Options)
- Cross-origin attacks (Cross-Origin-Opener-Policy)
- Referrer leakage (Referrer-Policy)
- Unencrypted connections (Strict-Transport-Security)
- XSS attacks (Content-Security-Policy)

### Custom Referrer Policy

Control how much referrer information is sent to other sites:

```typescript
app.use(
  ...securityHeaders({
    // Send only the origin, no path information
    referrerPolicy: "strict-origin-when-cross-origin",
  }),
);
```

**Policy options:**

- `"no-referrer"` - Send no referrer information (default, most private)
- `"strict-origin-when-cross-origin"` - Send origin only for cross-origin
  requests
- `"same-origin"` - Send full referrer only for same-origin requests
- `"origin"` - Always send just the origin
- `"unsafe-url"` - Always send full URL (least private)

### Restrict Frame Embedding

Prevent your site from being embedded in frames on other domains:

```typescript
app.use(
  ...securityHeaders({
    xFrameOptions: "DENY", // Never allow framing
  }),
);

// Or allow same-origin framing
app.use(
  ...securityHeaders({
    xFrameOptions: "SAMEORIGIN", // Allow framing only from your domain
  }),
);
```

Use `"DENY"` for maximum security. Use `"SAMEORIGIN"` if your application needs
to be framed by your own pages.

### Browser Feature Permissions

Control access to sensitive browser features like geolocation and camera:

```typescript
app.use(
  ...securityHeaders({
    permissionsPolicy: {
      geolocation: ["self"], // Allow geolocation only for your origin
      camera: ["none"], // Disable camera entirely
      microphone: ["self", "https://trusted-service.com"], // Allow specific services
      payment: [], // Disable payment request API
    },
  }),
);
```

Features you might want to restrict:

- `geolocation` - User's location
- `camera` - Device camera
- `microphone` - Device microphone
- `usb` - USB device access
- `payment` - Payment request API
- `vr` - VR headset access

Use `["none"]` or `[]` to disable, `["self"]` to allow only your origin, or
`["self", "https://domain.com"]` to allow specific domains.

### Enhanced HSTS

Enforce HTTPS with longer cache duration:

```typescript
app.use(
  ...securityHeaders({
    // Cache for 2 years, include subdomains, add to preload list
    strictTransportSecurity: "max-age=63072000; includeSubDomains; preload",
  }),
);
```

**HSTS options:**

- `max-age` - Cache duration in seconds (default: 6 months = 15552000)
- `includeSubDomains` - Apply to subdomains (recommended)
- `preload` - Allow inclusion in browser HSTS preload lists

### Custom CSP Policy

Override Content-Security-Policy with a stricter policy:

```typescript
app.use(
  ...securityHeaders({
    csp: {
      directives: {
        defaultSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "https:"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
      },
    },
  }),
);
```

See the [CSP middleware](/middleware/csp) documentation for detailed information
about Content Security Policy configuration.

### Disable Server Fingerprinting

Prevent attackers from learning about your server software:

```typescript
app.use(
  ...securityHeaders({
    removeXPoweredBy: true, // Remove X-Powered-By (default)
  }),
);

// X-Powered-By headers will be removed from all responses
```

This removes the `X-Powered-By` header that frameworks often add. While not a
direct security vulnerability, it prevents attackers from fingerprinting your
tech stack.

### Minimal Configuration

Only override what you need:

```typescript
app.use(
  ...securityHeaders({
    xFrameOptions: "DENY",
    permissionsPolicy: {
      geolocation: ["none"],
    },
  }),
);
```

All other headers use their defaults. This is the recommended approach for most
applications.

## Security Considerations

**Protects against**: Clickjacking, MIME-sniffing, cross-origin attacks,
referrer leakage, unencrypted connections, XSS, feature abuse

**Doesn't protect**: CSRF (use CSRF middleware), SQL injection, auth bypasses,
network eavesdropping (use HTTPS)

**Best practices**:

- Start with defaults
- Use strict HSTS with `preload`
- Disable unused features in `permissionsPolicy`
- Match CSP strictness to your needs

## Notes

- Returns array—use spread operator: `...securityHeaders()`
- Includes CSP middleware by default
- Test HSTS thoroughly before deploying (browsers cache it)

## Related

- [CSP Middleware](/middleware/csp) - Detailed Content Security Policy
  configuration
- [Middleware System](/core/middleware) - How middleware works in Mage
- [Request/Response](/core/request-response) - Setting headers in handlers
- [MDN: HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers) -
  Complete header reference
- [OWASP: Security Headers](https://owasp.org/www-project-secure-headers/) -
  Security header best practices
