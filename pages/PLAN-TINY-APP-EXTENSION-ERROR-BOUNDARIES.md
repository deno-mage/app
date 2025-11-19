# Hydration Error Boundaries - Extension to PLAN-TINY-APP.md

## Overview

This extension adds error boundary handling to the client-side hydration
implementation. Error boundaries prevent hydration failures from breaking the
entire page and provide graceful degradation.

## Integration Point

**Add to Phase 6: Props Serialization & Hydration**

After the basic hydration works, add error boundary wrapper before integration
testing.

## Implementation

### 1. Error Boundary Component

**Location:** `pages/error-boundary.tsx`

```tsx
import { Component, ComponentChildren } from "preact";

export interface ErrorBoundaryProps {
  children: ComponentChildren;
  fallback?: ComponentChildren;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary for hydration failures.
 *
 * Catches errors during hydration and displays fallback UI instead of
 * breaking the entire page. The SSR'd content remains visible.
 */
export class ErrorBoundary
  extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    // Log to console for debugging
    console.error("Hydration error:", error, errorInfo);

    // In production, could send to error tracking service
    if (
      typeof window !== "undefined" && (window as any).__MAGE_ERROR_HANDLER__
    ) {
      (window as any).__MAGE_ERROR_HANDLER__(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Return custom fallback or default message
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}
```

### 2. Updated Entry Point Template

**Modify in:** `bundle-builder.ts` entry point generation

```typescript
// Generated for each page
const entryTemplate = `
import { hydrate } from "preact";
import { ErrorBoundary } from "@mage/app/pages/error-boundary";
import Layout from "${layoutPath}";

// Extract article HTML from DOM
const appRoot = document.getElementById("app");
if (!appRoot) {
  console.error("Failed to find #app element - hydration aborted");
  // Page still works with SSR'd content, just no interactivity
} else {
  const articleContainer = appRoot.querySelector('[data-article-html="true"]');

  const props = {
    ...window.__PAGE_PROPS__,
    html: articleContainer ? articleContainer.innerHTML : "",
  };

  try {
    // Hydrate with error boundary
    hydrate(
      <ErrorBoundary>
        <Layout {...props} />
      </ErrorBoundary>,
      appRoot
    );
  } catch (error) {
    console.error("Hydration failed:", error);
    // Page remains functional with SSR'd HTML
  }
}
`;
```

### 3. Export Error Boundary

**Add to:** `pages/mod.ts`

```typescript
export { Head } from "./head.tsx";
export { ErrorBoundary } from "./error-boundary.tsx";
export type { HtmlTemplateProps } from "./types.ts";
```

## Behavior

### When Hydration Succeeds

1. Error boundary is invisible
2. Layout hydrates normally
3. Interactive features work

### When Hydration Fails

1. Error boundary catches the error
2. Logs to console with details
3. Returns `null` (or custom fallback)
4. **SSR'd HTML remains visible and functional**
5. User sees content, loses interactivity only

## User Experience

**Best case:** Everything works, user doesn't know error boundary exists

**Failure case:**

- Page loads normally (SSR'd HTML)
- Content is readable
- Links work (server-side navigation)
- Forms work (server-side submission)
- Interactive features (buttons, state) don't work
- Console shows error for developers
- **No white screen, no crash**

## Testing

**Add to Phase 6 test suite:**

```typescript
// bundle-builder.test.ts or integration.test.ts

Deno.test("hydration errors are caught by error boundary", async () => {
  // Create layout that throws during hydration
  const layout = `
    import { useState } from "preact/hooks";
    export default function BrokenLayout(props) {
      if (typeof window !== "undefined") {
        throw new Error("Simulated hydration error");
      }
      return <div>{props.html}</div>;
    }
  `;

  const entry = generateEntryPoint(layout, props);
  const bundle = await buildBundle(entry);

  // Load in test browser (e.g., puppeteer/playwright)
  const page = await loadInBrowser(bundle);

  // Verify SSR content still visible
  const content = await page.textContent("article");
  assertEquals(content, "Expected article content");

  // Verify error was logged
  const consoleErrors = await page.consoleMessages();
  assert(consoleErrors.some((msg) => msg.includes("hydration error")));

  // Verify no white screen
  const isVisible = await page.isVisible("article");
  assert(isVisible);
});
```

## Custom Error UI (Optional)

Layouts can provide custom fallback UI:

```tsx
// layouts/docs.tsx
import { ErrorBoundary, Head } from "@mage/app/pages";

export default function DocsLayout(props: LayoutProps) {
  return (
    <>
      <Head>
        <title>{props.title}</title>
      </Head>

      <ErrorBoundary
        fallback={
          <div style="padding: 1rem; background: #fef2f2; border: 1px solid #fca5a5;">
            <p>
              Interactive features unavailable. Content is still readable below.
            </p>
          </div>
        }
      >
        <nav>
          <a href="/">Home</a>
        </nav>

        <main>
          <h1>{props.title}</h1>
          <article
            data-article-html="true"
            dangerouslySetInnerHTML={{ __html: props.html }}
          />
        </main>
      </ErrorBoundary>
    </>
  );
}
```

## Error Tracking Integration

For production error monitoring:

```typescript
// In _html.tsx template
export default function HtmlTemplate(
  { head, body, bundleUrl, props }: HtmlTemplateProps,
) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  ${head}
</head>
<body>
  <div id="app" data-layout="true">${body}</div>
  ${
    bundleUrl
      ? `
    <script>
      window.__PAGE_PROPS__ = ${JSON.stringify(props)};

      // Optional: Hook for error tracking service
      window.__MAGE_ERROR_HANDLER__ = function(error, errorInfo) {
        // Send to Sentry, LogRocket, etc.
        console.error("Sending error to tracking:", error);
      };
    </script>
    <script type="module" src="${bundleUrl}"></script>
  `
      : ""
  }
</body>
</html>`;
}
```

## Updated Success Criteria

Add to Phase 6 success criteria:

- ✅ Error boundary catches hydration failures
- ✅ SSR'd content remains visible on hydration error
- ✅ Console shows clear error messages
- ✅ No white screen of death
- ✅ Custom fallback UI can be provided (optional)

## Documentation Updates

**Add to README hydration section:**

### Error Handling

Hydration errors are caught automatically by error boundaries. If hydration
fails:

- Your SSR'd content remains visible
- Interactive features won't work
- Error is logged to console
- No page crash

To customize error UI:

```tsx
import { ErrorBoundary } from "@mage/app/pages";

<ErrorBoundary fallback={<p>Content only mode</p>}>
  <YourInteractiveComponent />
</ErrorBoundary>;
```

## Implementation Notes

### Keep It Simple

- Error boundary uses Preact's built-in `componentDidCatch`
- No external error handling libraries
- Logs to console (sufficient for MVP)
- Optional hook for error tracking services

### Progressive Enhancement

- Page works without JavaScript (SSR'd HTML)
- Hydration adds interactivity
- Error boundary ensures graceful degradation
- Users always get content, even if JS fails

### Testing Strategy

- Unit test: Error boundary component catches errors
- Integration test: Entry point wraps layout correctly
- E2E test (future): Verify behavior in real browser

## Timeline Impact

**Minimal - adds ~0.5-1 day to Phase 6:**

- Error boundary component: 1-2 hours
- Entry point modification: 30 minutes
- Tests: 2-3 hours
- Documentation: 1 hour

**Total: ~4-6 hours of work**

## Benefits

1. **Resilience:** Hydration errors don't break the page
2. **User experience:** Content always visible
3. **Developer experience:** Clear error messages
4. **Production ready:** Can integrate error tracking
5. **Progressive enhancement:** Aligns with web standards

## Conclusion

Error boundaries add minimal complexity while significantly improving
reliability. They're a standard React/Preact pattern and align with progressive
enhancement principles.

This extension should be implemented as part of Phase 6 before integration
testing begins.
