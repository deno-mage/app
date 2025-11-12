# logs

Structured logger with color-coded output for Mage applications.

## Installation

```typescript
import { MageLogger } from "@mage/app/logs";
```

## Usage

```typescript
const logger = new MageLogger("my-plugin");

logger.success("Operation completed successfully");
logger.info("Server started on port 3000");
logger.warn("Deprecated API usage detected");
logger.error("Database connection failed");
logger.error(new Error("Something went wrong"));
```

## API

**`new MageLogger(source)`**

- `success(message)` - Green log message
- `info(message)` - Blue log message
- `warn(message)` - Yellow log message
- `error(message | Error)` - Red log message

## Notes

- Outputs in format: `[Source][Level] message`
- Color-coded for easy scanning in terminal
- Source parameter helps identify log origin (e.g., plugin name)
