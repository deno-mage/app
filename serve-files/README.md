# serve-files

Middleware for serving static files from a directory.

## Installation

```typescript
import { serveFiles } from "@mage/app/serve-files";
```

## Usage

```typescript
app.get(
  "/static/*",
  serveFiles({
    directory: "./public",
    serveIndex: true,
  }),
);
```

## Options

| Option       | Type      | Default    | Description                      |
| ------------ | --------- | ---------- | -------------------------------- |
| `directory`  | `string`  | (required) | Directory to serve files from    |
| `serveIndex` | `boolean` | `true`     | Serve index.html for directories |

## Notes

- Only serves on GET and HEAD requests (returns 405 for others)
- Must be used with wildcard routes (e.g., `/static/*`)
- Prevents path traversal attacks automatically
- Returns 404 if file doesn't exist
- When `serveIndex: true`, `/folder/` serves `/folder/index.html`
