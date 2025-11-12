# csp

Middleware for Content Security Policy (CSP) headers.

## Installation

```typescript
import { csp } from "@mage/app/csp";
```

## Usage

```typescript
app.use(
  csp({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.example.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  }),
);
```

## Options

| Option       | Type                                    | Description                               |
| ------------ | --------------------------------------- | ----------------------------------------- |
| `directives` | `CSPDirectives \| (c) => CSPDirectives` | Static object or function for dynamic CSP |

**Available Directives:** `defaultSrc`, `scriptSrc`, `styleSrc`, `imgSrc`,
`fontSrc`, `connectSrc`, `mediaSrc`, `objectSrc`, `frameSrc`, `childSrc`,
`workerSrc`, `manifestSrc`, `prefetchSrc`, `baseUri`, `formAction`,
`frameAncestors`, `sandbox`, `reportTo`, `upgradeInsecureRequests`,
`trustedTypes`, `requireTrustedTypesFor`, and more.

## Notes

- Provides secure defaults if no directives specified
- Use function form for dynamic policies (e.g., nonce generation per request)
- Directive values can be strings or arrays
- `upgradeInsecureRequests` is boolean, others are string/array
