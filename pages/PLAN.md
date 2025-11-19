# Islands Architecture - Implementation Plan

## Overview

Add islands architecture to the pages module for client-side interactive
components. Simple, convention-based design that builds on existing
infrastructure.

**Key decision: Client-only rendering (no SSR)**

- Islands render entirely on the client as mini-SPAs
- Simpler implementation, no hydration mismatch issues
- Preact is tiny (~3-4KB), modern networks make FOUC negligible
- Perfect for interactive widgets on docs sites

## Design

### 1. Islands Folder (Convention-Based Detection)

**Location:** `/islands` (project root, next to `/pages`, `/layouts`, `/public`)

**Structure:**

```
project/
├── islands/
│   ├── counter.tsx        # Island component
│   ├── search-box.tsx     # Island component
│   └── user-menu.tsx      # Island component
├── pages/
├── layouts/
└── public/
```

**Convention:**

- Any `.tsx` file in `/islands` is automatically treated as an island
- Each island exports a default Preact component
- Islands are built into individual bundles for code-splitting

### 2. Build Step (esbuild Bundler)

**Development mode:**

- Watch `/islands` folder for changes
- Build each island into individual bundle: `counter.tsx` →
  `dist/__islands/counter.js`
- Rebuild on file changes (watch mode)
- Bundle includes Preact runtime + component code

**Production mode:**

- Build all islands during static build
- Hash filenames for cache-busting: `counter.js` → `counter-abc123.js`
- Minify bundles

**Build configuration:**

- esbuild with Preact JSX transform
- Output format: ESM
- Target: modern browsers (ES2020+)
- Bundle Preact with each island (for now - optimize later if needed)

### 3. Server-Side Placeholder

**Mechanism:** Render placeholder with island metadata, client renders the
component

**Component wrapper:**

```tsx
import { Island } from "@mage/app/pages";

<Island name="counter" props={{ initialCount: 0 }} />;
```

**Server renders to:**

```html
<div mage-island="counter" data-props='{"initialCount":0}'>
  <!-- Empty or optional loading skeleton -->
</div>
```

**Why client-only:**

- No SSR complexity or hydration mismatches
- No cache-busting issues for island components
- Islands are purely client-side concerns
- Faster server rendering (less work)
- Simpler implementation and maintenance

**Optional loading states:**

```tsx
<Island
  name="counter"
  props={{ initialCount: 0 }}
  fallback={<div>Loading counter...</div>}
/>;
```

### 4. Client-Side Rendering

**Loader script:** Small inline script that:

1. Scans DOM for `[mage-island]` elements
2. Extracts unique island names
3. Dynamically imports island bundles
4. Islands render themselves into their placeholders

**Script location:** Auto-injected just before `</body>`

**Rendering mechanism:**

```typescript
// In island bundle (auto-generated wrapper)
import Component from "./counter.tsx";
import { render } from "preact";

// Find all elements for this island
const elements = document.querySelectorAll('[mage-island="counter"]');

elements.forEach((el) => {
  // Parse props from data attribute
  const props = JSON.parse(el.getAttribute("data-props") || "{}");

  // Render component (not hydrate - we're rendering fresh)
  render(<Component {...props} />, el);
});
```

**Loader script (inline):**

```html
<script type="module">
  // Collect all unique island names
  const islands = new Set();
  document.querySelectorAll("[mage-island]").forEach((el) => {
    islands.add(el.getAttribute("mage-island"));
  });

  // Load each island bundle
  islands.forEach((name) => {
    import(`/__islands/${name}.js`);
  });
</script>
```

**Performance characteristics:**

- Preact core: ~3-4KB gzipped
- Typical island: ~1-2KB component code
- Total per island: ~5-6KB
- Loads in parallel, executes in milliseconds
- Negligible impact on modern networks

## Implementation Steps

### Phase 1: Islands Scanner & Builder

1. Create `islands.ts` - Scanner to find islands in `/islands` folder
2. Create `islands-builder.ts` - esbuild integration to bundle islands
3. Add watch mode support for dev server
4. Write tests for scanner and builder

### Phase 2: Island Component Wrapper

1. Create `Island.tsx` component that:
   - Accepts `name` and `props` props
   - Renders placeholder div with `mage-island` attribute
   - Serializes props to `data-props`
   - Optionally renders fallback/loading content
2. Export from `mod.ts`
3. Write tests for Island component

### Phase 3: Client Rendering Script

1. Create `islands-loader.ts` - Template for inline loader script
2. Generate rendering wrappers for each island during build
3. Auto-inject loader script into layouts (before `</body>`)
4. Write integration tests

### Phase 4: Dev Server Integration

1. Serve island bundles from `/__islands/*` route
2. Watch `/islands` folder for changes
3. Rebuild islands on change
4. Trigger page reload when islands change

### Phase 5: Build Integration

1. Build islands during static build
2. Hash island bundle filenames
3. Copy islands to `dist/__islands/`
4. Update loader script with hashed filenames

### Phase 6: Documentation & Examples

1. Update README with islands section
2. Create example project with islands
3. Document API and patterns
4. Add to pages module docs

## Open Questions

1. **Preact bundling strategy:**

   - Bundle Preact with each island (simpler, larger) ✓ Start here
   - Shared Preact bundle (complex, smaller) - Optimize later

2. **Props serialization:**

   - JSON only (simple, limited types) ✓ Start here
   - Custom serialization (complex, more types) - Add if needed

3. **Error handling:**

   - What if island bundle fails to load?
   - What if rendering fails?
   - Show error UI? Log to console? Both?
   - Keep fallback content on error?

4. **TypeScript support:**

   - Type-check islands during build?
   - Generate type definitions for Island component?

5. **Hot module reload:**
   - Full page reload on island changes? ✓ Start here
   - Preserve island state during HMR? - Nice to have

6. **Loading states:**
   - Empty div (simplest, may cause layout shift)
   - Optional fallback content (skeleton loaders)
   - CSS to prevent layout shift?

## Future Enhancements

- Shared Preact runtime bundle (optimize bundle size)
- Lazy loading (intersection observer for below-fold islands)
- Island nesting (islands within islands)
- Build-time dead code elimination
- Island prefetching based on user interaction
- Developer tools (visualize islands on page)
- SSR opt-in for islands that need it (progressive enhancement)
- Skeleton/loading state helpers

## Success Criteria

- Developer adds `.tsx` file to `/islands` folder
- Developer uses `<Island name="..." props={...} />` component in layout
- Placeholder is server-rendered with props
- Client-side JavaScript renders component into placeholder
- Interactive behavior works as expected
- No framework code in pages without islands
- Islands are independently cacheable
- Bundle sizes are reasonable (~5-6KB per island including Preact)
- No cache-busting workarounds needed for islands
- No SSR complexity or hydration mismatches

## Trade-offs Accepted

**Client-only rendering means:**

- ❌ Flash of empty content before islands load (mitigated: Preact is tiny,
  loads fast)
- ❌ No SEO for island content (acceptable: islands are interactive widgets, not
  content)
- ❌ Slight layout shift possible (mitigated: use fallback/skeleton content)

**Benefits gained:**

- ✅ Dramatically simpler implementation
- ✅ No hydration mismatch bugs
- ✅ No cache-busting issues for island components
- ✅ Faster server rendering
- ✅ Easier debugging and maintenance
- ✅ True separation of concerns (server renders content, client renders
  interactivity)
