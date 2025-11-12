# security-headers

Middleware for adding common security headers to protect against web
vulnerabilities.

## Installation

```typescript
import { securityHeaders } from "@mage/app/security-headers";
```

## Usage

```typescript
app.use(
  ...securityHeaders({
    referrerPolicy: "strict-origin-when-cross-origin",
    permissionsPolicy: {
      geolocation: ["self"],
      camera: ["none"],
    },
  }),
);
```

## Options

| Option                          | Type                            | Default                                 | Description                     |
| ------------------------------- | ------------------------------- | --------------------------------------- | ------------------------------- |
| `csp`                           | `CSPOptions`                    | Secure defaults                         | Content-Security-Policy options |
| `referrerPolicy`                | `string`                        | `"no-referrer"`                         | Referrer information control    |
| `strictTransportSecurity`       | `string`                        | `"max-age=15552000; includeSubDomains"` | HTTPS enforcement               |
| `xFrameOptions`                 | `"DENY" \| "SAMEORIGIN"`        | `"SAMEORIGIN"`                          | Frame rendering control         |
| `xContentTypeOptions`           | `boolean`                       | `true`                                  | Prevent MIME-sniffing           |
| `xDnsPrefetchControl`           | `boolean`                       | `false`                                 | DNS prefetching control         |
| `xDownloadOptions`              | `boolean`                       | `true`                                  | IE download prevention          |
| `xPermittedCrossDomainPolicies` | `string`                        | `"none"`                                | Cross-domain policy             |
| `xXssProtection`                | `"0" \| "1" \| "1; mode=block"` | `"0"`                                   | Legacy XSS protection           |
| `crossOriginOpenerPolicy`       | `string`                        | `"same-origin"`                         | Window opener context           |
| `crossOriginResourcePolicy`     | `string`                        | `"same-origin"`                         | Resource sharing control        |
| `originAgentCluster`            | `boolean`                       | `true`                                  | Browsing context isolation      |
| `removeXPoweredBy`              | `boolean`                       | `true`                                  | Remove server fingerprinting    |
| `permissionsPolicy`             | `Record<string, string[]>`      | -                                       | Browser feature permissions     |

## Notes

- Returns array of middleware (spread with `...securityHeaders()`)
- Includes CSP middleware automatically
- `xXssProtection: "0"` is recommended (legacy header, use CSP instead)
