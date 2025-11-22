# Mage Documentation Writing Style Guide

This guide defines the standards for all Mage documentation. Follow these
guidelines to ensure consistency, clarity, and alignment with Mage's core
philosophy.

## Core Philosophy

Mage is **no-nonsense, simple, secure, and TypeScript-native**. Documentation
must reflect these values:

- **No-nonsense**: Get to the point quickly. No fluff, no marketing speak.
- **Simple**: Explain clearly without dumbing down. Assume readers know
  JavaScript/TypeScript basics.
- **Secure**: Always highlight security implications and best practices.
- **TypeScript-native**: Show full type signatures, explain type safety
  benefits.

## Tone and Voice

**Use second person ("you")** - Be conversational and direct.

```markdown
✅ You can add middleware to handle CORS requests. ❌ Users can add middleware
to handle CORS requests. ❌ One can add middleware to handle CORS requests.
```

**Use present tense** - Keep language immediate and active.

```markdown
✅ The middleware validates the request body. ❌ The middleware will validate
the request body.
```

**Use active voice** - Make the subject clear.

```markdown
✅ Mage validates route patterns when you register them. ❌ Route patterns are
validated when they are registered.
```

**Be direct and confident** - Avoid hedging language.

```markdown
✅ This prevents path traversal attacks. ❌ This should help prevent path
traversal attacks. ❌ This might prevent path traversal attacks.
```

**Avoid jargon without definition** - Define terms the first time you use them.

```markdown
✅ Mage uses lazy response materialization (building the Response object only
when needed). ❌ Mage uses lazy response materialization.
```

## Page Structure

Every documentation page must follow this structure:

### 1. Frontmatter

```markdown
---
title: Component Name
description: One sentence describing what it does and why it matters.
layout: docs
---
```

- **title**: The component/concept name (e.g., "MageApp", "CORS Middleware")
- **description**: 1 sentence, max 160 characters, actionable (not just "Learn
  about X")
- **layout**: Always `docs` for standard pages

### 2. Introduction (1-2 sentences)

Start with what it is and why it matters. No preamble.

```markdown
✅ The CORS middleware handles Cross-Origin Resource Sharing by adding the
necessary HTTP headers to your responses.

❌ In this guide, we'll explore the CORS middleware, which is a powerful tool
for handling cross-origin requests in your Mage application.
```

### 3. Quick Example

Show the most common use case immediately, before any explanation.

```typescript
import { MageApp } from "@mage/core";
import { cors } from "@mage/middleware/cors";

const app = new MageApp();

app.use(cors({
  origin: "https://example.com",
}));

app.get("/api/users", (c) => c.json({ users: [] }));

Deno.serve(app.handle);
```

**Quick example requirements:**

- Include all necessary imports
- Show realistic variable names (no `foo`, `bar`, `baz`)
- Complete and runnable
- Comment non-obvious lines only
- TypeScript types included where relevant

### 4. Concept Explanation

Now explain how it works and when to use it.

- Break into subsections with H3 headings
- Use progressive disclosure (simple first, complexity later)
- Explain security implications for security-related features
- Link to related concepts

### 5. API Reference

Document all options, parameters, methods, and properties.

**Use tables for options:**

```markdown
## Options

| Option   | Type                 | Default | Description                                      |
| -------- | -------------------- | ------- | ------------------------------------------------ |
| `origin` | `string \| string[]` | `"*"`   | Allowed origin(s) for CORS requests              |
| `maxAge` | `number`             | `86400` | Cache duration for preflight requests in seconds |
```

**For methods/properties:**

```markdown
## Methods

### `c.json(data, status?)`

Returns a JSON response.

**Parameters:**

- `data` - The data to serialize as JSON
- `status` - Optional HTTP status code (default: 200)

**Returns:** `Response`

**Example:** \`\`\`typescript app.get("/users", (c) => c.json({ users: [] }));
\`\`\`
```

### 6. Advanced Patterns (when applicable)

Cover edge cases, performance tips, composition patterns, and security
considerations.

### 7. Related Topics

Link to connected concepts at the end.

```markdown
## Related

- [Middleware System](/core/middleware) - How middleware works in Mage
- [Security Headers](/middleware/security-headers) - Additional security
  middleware
```

## Code Examples

### General Rules

1. **Always include imports** - Every example should be copy-paste ready
2. **Use realistic names** - `users`, `products`, `auth` (not `foo`, `bar`)
3. **Show types** - Include TypeScript type annotations for clarity
4. **Keep it focused** - One concept per example
5. **Comment strategically** - Explain why, not what

### Example Format

```typescript
import { MageApp } from "@mage/core";
import { rateLimit } from "@mage/middleware/rate-limit";

const app = new MageApp();

// Limit to 100 requests per minute per IP
app.use(rateLimit({
  max: 100,
  window: 60_000,
  keyGenerator: (c) => c.req.header("cf-connecting-ip") || "unknown",
}));

app.get("/api/data", (c) => {
  return c.json({ message: "Rate limited endpoint" });
});

Deno.serve(app.handle);
```

### Error Examples

Show common errors and their solutions:

```typescript
// ❌ Don't do this - missing await
app.get("/users", (c) => {
  const body = c.req.body(); // Returns a promise!
  return c.json(body);
});

// ✅ Do this instead
app.get("/users", async (c) => {
  const body = await c.req.body();
  return c.json(body);
});
```

### Security Examples

Always show both insecure and secure patterns for security-related features:

```typescript
// ❌ Insecure - vulnerable to path traversal
app.get("/files/:path", (c) => {
  const path = c.req.param("path");
  return c.file(`./uploads/${path}`);
});

// ✅ Secure - path traversal protection built-in
import { serveFiles } from "@mage/middleware/serve-files";
app.use(serveFiles({ root: "./uploads" }));
```

## TypeScript Types

### When to Show Types

- **Always** for public API signatures
- **Always** for complex options objects
- **Sometimes** for inline examples (when it aids understanding)
- **Never** for obvious primitives in simple examples

### Type Display Format

```typescript
// Full interface definition
interface RateLimitOptions {
  /**
   * Maximum requests allowed within the time window
   */
  max: number;

  /**
   * Time window in milliseconds
   */
  window: number;

  /**
   * Function to generate a unique key for rate limiting
   * @default Uses client IP address
   */
  keyGenerator?: (c: MageContext) => string;
}
```

### Inline Types

```typescript
// Use inline types for clarity in examples
const app = new MageApp<{
  Variables: {
    user: { id: string; name: string };
  };
}>();
```

## Writing for Different Page Types

### Core Component Pages

**Structure:**

1. Brief intro (what it is)
2. Quick example
3. Creating instances / Basic usage
4. Properties
5. Methods
6. Advanced usage
7. TypeScript types
8. Related topics

**Focus on:**

- Complete API coverage
- Type safety benefits
- Common patterns
- Integration with other components

### Middleware Pages

Use this standardized structure for all middleware:

```markdown
---
title: [Middleware Name]
description: [One sentence: what it does]
layout: docs
---

# [Middleware Name]

[1-2 sentence intro: what it is and why it matters]

## Quick Start

[Minimal working example with imports]

## Installation

[If separate package, show installation command]

## How It Works

[Explain the mechanism and when to use it]

## Options

[Table of all configuration options]

## Examples

### [Common Use Case 1]

[Code example]

### [Common Use Case 2]

[Code example]

## Security Considerations

[Security implications, attack vectors prevented, best practices]

## Notes

- [Important behavior 1]
- [Important behavior 2]
- [Performance considerations]
- [Common gotchas]

## Related

- [Link to related middleware]
- [Link to core concepts]
```

### Utility Pages

**Structure:**

1. Brief intro
2. Quick example
3. API reference (functions/methods)
4. Common patterns
5. Edge cases
6. Related topics

**Keep it concise** - Utilities are simple, don't over-explain.

### Guide Pages

**Structure:**

1. Goal statement (what you'll build)
2. Prerequisites
3. Step-by-step instructions
4. Complete working example
5. Next steps

**Guidelines:**

- Number the steps
- Show complete code at each step
- Explain why, not just what
- Include a "full example" at the end
- Link to deeper dives

### Reference Pages

**Structure:**

1. Brief intro
2. Organized sections (alphabetical or logical grouping)
3. Search-friendly headings
4. Minimal prose, maximum information density

## Language and Terminology

### Consistent Terms

Use these terms consistently:

| Use This   | Not This                              |
| ---------- | ------------------------------------- |
| middleware | plugin, interceptor, handler          |
| route      | endpoint, path, URL                   |
| handler    | route handler, controller             |
| request    | req (in prose, use `req` in code)     |
| response   | res (in prose, use `res` in code)     |
| context    | ctx (in prose, use `c` in code)       |
| parameter  | param (in prose, use `param` in code) |

### Variable Naming in Code

- Context: `c` (not `ctx`, `context`)
- Application: `app` (not `server`, `application`)
- Request: `c.req` (accessed through context)
- Response: `c.res` (accessed through context)

### Capitalization

- **Mage** - Always capitalize (it's a proper noun)
- **MageApp, MageContext, MageRequest, MageResponse, MageError** - PascalCase
  (class names)
- **HTTP** - All caps
- **JavaScript, TypeScript, Deno** - Standard capitalization
- **JSON, HTML, XML** - All caps

## Common Patterns

### Explaining "Why"

Always explain why something exists or why you'd use it:

```markdown
✅ Mage uses lazy response materialization to allow middleware to modify headers
even after handlers have set them. This makes middleware composition more
flexible.

❌ Mage uses lazy response materialization.
```

### Showing Alternatives

When multiple approaches exist, show them:

```markdown
## Setting Response Headers

You can set headers in two ways:

**Using the header() method:** \`\`\`typescript app.get("/", (c) => {
c.header("X-Custom", "value"); return c.text("Hello"); }); \`\`\`

**Passing headers to response helpers:** \`\`\`typescript app.get("/", (c) => {
return c.text("Hello", 200, { "X-Custom": "value" }); }); \`\`\`

Use `header()` when setting multiple headers. Use the inline approach for
one-off headers.
```

### Warning About Gotchas

Use clear callouts for important warnings:

```markdown
**Important:** The body can only be read once in standard Fetch API. Mage
memoizes the body, so you can call `c.req.body()` multiple times safely.
```

### Performance Notes

Call out performance implications:

```markdown
**Performance:** The linear router uses O(n) search. For most applications (<100
routes), this is faster than radix trees due to lower overhead. For serverless
functions, this is optimal.
```

## Links and Cross-References

### Internal Links

Use absolute paths from the docs root:

```markdown
✅ See [Middleware System](/core/middleware) for details. ❌ See
[Middleware System](../core/middleware) for details. ❌ See
[Middleware System](./middleware) for details.
```

### External Links

Open in new tab for external resources:

```markdown
For more on HTTP caching, see
[MDN: HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching).
```

### Code Links

Link to source code for "view source" links:

```markdown
[View source](https://github.com/mage/mage/blob/main/core/app.ts)
```

## Formatting Standards

### Headings

- H1: Page title only (from frontmatter)
- H2: Major sections
- H3: Subsections
- Never skip levels (no H2 → H4)

### Lists

**Use bullet lists for:**

- Unordered items
- Features
- Notes

**Use numbered lists for:**

- Sequential steps
- Ordered procedures
- Priority-ranked items

### Emphasis

- **Bold** for UI elements, important terms, emphasis
- _Italic_ for introducing new terms (first use only)
- `Code` for code elements, filenames, package names
- Never use ALL CAPS for emphasis

### Code Blocks

Always specify the language:

````markdown
```typescript
// TypeScript code
```

```bash
# Shell commands
```

```json
{
  "json": "data"
}
```
````

## Security Documentation

Security features require special attention:

### Always Include:

1. **What attack it prevents**
2. **How it works** (briefly)
3. **Configuration options**
4. **Example of vulnerable code** (with ❌)
5. **Example of secure code** (with ✅)
6. **Limitations** (what it doesn't protect against)

### Example:

```markdown
## CSRF Protection

The CSRF middleware prevents Cross-Site Request Forgery attacks by validating
request origins.

### How It Works

Uses Fetch Metadata headers and Origin validation to verify requests come from
your site:

1. Checks `Sec-Fetch-Site` header (if present)
2. Falls back to `Origin` header validation
3. Rejects cross-site state-changing requests

### What It Protects Against

- ✅ Cross-site form submissions
- ✅ Cross-site fetch/XHR requests
- ✅ CSRF attacks via HTML forms

### What It Doesn't Protect Against

- ❌ Same-site request forgery
- ❌ XSS attacks (use CSP middleware)
- ❌ Subdomain attacks (configure origins carefully)
```

## Quality Checklist

Before publishing any documentation page:

- [ ] Can a beginner follow the quick example?
- [ ] Are all imports included?
- [ ] Do code examples actually work?
- [ ] Are TypeScript types accurate?
- [ ] Is security information complete?
- [ ] Are there links to related topics?
- [ ] Is the language clear and concise?
- [ ] Would I understand this without existing context?

## Maintenance

Documentation is part of the deliverable. When code changes:

1. Update affected docs immediately
2. Update code examples if APIs change
3. Add migration notes for breaking changes
4. Keep examples working (test them)

## Questions and Edge Cases

When unsure:

1. Check existing docs for patterns
2. Favor clarity over brevity
3. Show working code over prose
4. Ask: "Would this confuse a reader?"

---

**Remember:** Documentation is how users learn your framework. Invest the time
to make it excellent.
