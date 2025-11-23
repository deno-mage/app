---
title: "CSRF"
description: "Prevent Cross-Site Request Forgery attacks with Fetch Metadata and Origin validation"
---

# CSRF

The CSRF middleware protects your application from Cross-Site Request Forgery
attacks by validating that state-changing requests originate from your own site.

## Quick Start

```typescript
import { MageApp } from "@mage/app";
import { csrf } from "@mage/csrf";

const app = new MageApp();

// Enable CSRF protection on all routes
app.use(csrf());

app.post("/api/users", (c) => {
  return c.json({ created: true });
});

Deno.serve(app.handler);
```

## How It Works

Validates state-changing requests (POST, PUT, DELETE, PATCH) using
`Sec-Fetch-Site` and `Origin` headers. Only checks form submissions (not JSON,
which requires CORS preflight).

Returns 403 if both validation methods fail. See
[OWASP: CSRF](https://owasp.org/www-community/attacks/csrf) and
[Fetch Metadata](https://developer.mozilla.org/en-US/docs/Glossary/Fetch_metadata_request_header)
for details.

## Options

| Option         | Type                                                             | Default            | Description                                                                                                                                                                |
| -------------- | ---------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `origin`       | `string \| string[] \| IsAllowedOriginHandler`                   | Request URL origin | Allowed origin(s) for requests. Can be a single string, array of strings, or custom validation function.                                                                   |
| `secFetchSite` | `SecFetchSite \| SecFetchSite[] \| IsAllowedSecFetchSiteHandler` | `"same-origin"`    | Allowed Sec-Fetch-Site header values. Can be a single value, array, or custom validation function. Valid values: `"same-origin"`, `"same-site"`, `"none"`, `"cross-site"`. |

## Examples

### Basic Protection

The simplest configuration protects against cross-site requests by trusting the
default origin validation:

```typescript
import { MageApp } from "@mage/app";
import { csrf } from "@mage/csrf";

const app = new MageApp();

app.use(csrf());

app.post("/api/notes", (c) => {
  return c.json({ saved: true });
});

Deno.serve(app.handler);
```

### Allowing Multiple Origins

If your application is served from multiple domains, specify all allowed
origins:

```typescript
app.use(
  csrf({
    origin: [
      "https://example.com",
      "https://app.example.com",
      "https://staging.example.com",
    ],
  }),
);
```

### Custom Origin Validation

For complex scenarios, use a custom validation function to determine allowed
origins dynamically:

```typescript
app.use(
  csrf({
    origin: (origin, context) => {
      // Allow any subdomain of example.com
      if (origin.endsWith(".example.com") || origin === "https://example.com") {
        return true;
      }

      // Allow localhost in development
      if (context.env === "development" && origin === "http://localhost:3000") {
        return true;
      }

      return false;
    },
  }),
);
```

### Allowing Same-Site Requests

Some applications serve content from multiple subdomains that should trust each
other. Use `same-site` to allow requests between subdomains:

```typescript
app.use(
  csrf({
    secFetchSite: "same-site",
  }),
);
```

This allows requests where the origin is on the same registrable domain (e.g.,
`api.example.com` to `app.example.com`).

### Custom Sec-Fetch-Site Validation

For advanced scenarios, validate the Fetch Metadata header with custom logic:

```typescript
app.use(
  csrf({
    secFetchSite: (secFetchSite, context) => {
      // Allow same-origin in all environments
      if (secFetchSite === "same-origin") {
        return true;
      }

      // Allow same-site cross-origin requests in development
      if (context.env === "development" && secFetchSite === "same-site") {
        return true;
      }

      return false;
    },
  }),
);
```

## Security Considerations

**Protects against**: Cross-site form submissions, fetch/XHR from other domains

**Doesn't protect**: Same-site forgery, XSS, subdomain attacks, JSON APIs (use
CORS for those)

**Best practices**:

- Use with `SameSite` cookies
- Apply to all state-changing endpoints
- List specific origins (avoid wildcards)
- Missing `Origin` header = request denied

## Notes

- Only checks form content types (not JSON, which requires CORS preflight)
- Request rejected only if both Fetch Metadata and Origin checks fail
- Returns 403 Forbidden for rejected requests

## Related

- [Middleware System](/core/middleware) - Learn how middleware works in Mage
- [Request and Response](/core/request-response) - Understanding headers and
  HTTP methods
- [OWASP: Cross-Site Request Forgery (CSRF)](https://owasp.org/www-community/attacks/csrf) -
  CSRF attack details
- [Fetch Metadata Request Headers](https://developer.mozilla.org/en-US/docs/Glossary/Fetch_metadata_request_header) -
  MDN guide to Fetch Metadata
