# csrf

Stateless CSRF protection using Fetch Metadata and Origin validation.

## Installation

```typescript
import { csrf } from "@mage/app/csrf";
```

## Usage

```typescript
app.use(
  csrf({
    origin: ["https://example.com"],
    secFetchSite: ["same-origin", "same-site"],
  }),
);
```

## Options

| Option         | Type                                                                          | Default                    | Description                   |
| -------------- | ----------------------------------------------------------------------------- | -------------------------- | ----------------------------- |
| `origin`       | `string \| string[] \| function`                                              | Same origin as request URL | Allowed origins               |
| `secFetchSite` | `"same-origin" \| "same-site" \| "cross-site" \| "none" \| array \| function` | `"same-origin"`            | Allowed Sec-Fetch-Site values |

## Notes

- Uses modern Fetch Metadata headers (`Sec-Fetch-Site`) that cannot be forged
- Falls back to `Origin` header for older browsers
- Only validates unsafe methods (POST, PUT, DELETE, PATCH) with form content
  types
- JSON/API requests are not checked (CORS preflight protects them)
- No token generation or server-side storage required
- Returns 403 Forbidden if validation fails
