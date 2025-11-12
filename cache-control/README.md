# cache-control

Middleware for setting HTTP Cache-Control headers.

## Installation

```typescript
import { cacheControl } from "@mage/app/cache-control";
```

## Usage

```typescript
app.use(cacheControl({
  maxAge: 3600,
  public: true,
}));
```

## Options

| Option                 | Type      | Description                             |
| ---------------------- | --------- | --------------------------------------- |
| `maxAge`               | `number`  | Seconds the response can be cached      |
| `sMaxAge`              | `number`  | Seconds for shared cache (CDN)          |
| `noCache`              | `boolean` | Must check origin before use            |
| `noStore`              | `boolean` | No caching allowed                      |
| `noTransform`          | `boolean` | Don't transform cached content          |
| `mustRevalidate`       | `boolean` | Must revalidate stale cache             |
| `proxyRevalidate`      | `boolean` | Must revalidate (shared cache only)     |
| `mustUnderstand`       | `boolean` | Cache only if understood                |
| `private`              | `boolean` | Private cache only (browser)            |
| `public`               | `boolean` | Public cache allowed                    |
| `immutable`            | `boolean` | Response won't change while fresh       |
| `staleWhileRevalidate` | `number`  | Seconds to use stale while revalidating |
| `staleIfError`         | `number`  | Seconds to use stale if origin down     |

## Notes

- Throws `MageError` if conflicting directives are used (e.g., `public` +
  `private`)
- Cannot use `noStore` with `maxAge` or `sMaxAge`
