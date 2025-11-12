# status

Utilities and types for working with HTTP status codes.

## Installation

```typescript
import { type Status, statusText } from "@mage/app/status";
```

## Usage

```typescript
const message = statusText(404); // "Not Found"
const okMessage = statusText(200); // "OK"

// TypeScript types for status codes
type MyStatus = SuccessStatus; // 200-299
type ErrorStatus = ClientErrorStatus | ServerErrorStatus; // 400-499, 500-599
```

## API

**`statusText(code: Status): string`**

- Returns the standard text description for an HTTP status code

## Types

**Status Categories:**

- `InfoStatus` - 1xx informational
- `SuccessStatus` - 2xx success
- `RedirectStatus` - 3xx redirection
- `ClientErrorStatus` - 4xx client errors
- `ServerErrorStatus` - 5xx server errors
- `Status` - All valid status codes
- `ContentfulStatus` - Statuses that typically have body content
- `ContentlessStatus` - Statuses that typically have no body

## Notes

- Provides type-safe status code handling
- Use in conjunction with `c.text(statusText(404), 404)` for standardized
  responses
