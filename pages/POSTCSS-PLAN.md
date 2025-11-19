# PostCSS Support - Implementation Plan

## Overview

Add PostCSS processing pipeline to the pages module for modern CSS tooling
support. Plug-and-play experience for Tailwind, Autoprefixer, and other
PostCSS-based tools without coupling to any specific framework.

## Goals

- **Framework agnostic**: Support any PostCSS plugin ecosystem
- **Zero config default**: Works out of the box with sensible defaults
- **User configurable**: Respect project's `postcss.config.js` if present
- **Development friendly**: Fast rebuilds with proper caching
- **Production optimized**: Minification and optimization in build mode

## Design

### 1. PostCSS Integration Points

**Where CSS is processed:**

```
project/
├── public/
│   ├── styles.css          # Main stylesheet
│   ├── components/
│   │   └── button.css      # Component styles
│   └── tailwind.css        # Tailwind entry point
```

**Processing flow:**

1. Scan `/public` for `.css` files
2. Process each CSS file through PostCSS
3. Output processed CSS (in-memory for dev, to disk for build)
4. Apply existing cache-busting via asset map

### 2. Configuration

**Programmatic configuration via `pages()` options - no config files needed!**

**Default (no PostCSS):**

```typescript
const { build, registerDevServer } = pages({
  siteMetadata: { ... }
  // No postCss config = no PostCSS processing
});
```

**With Tailwind v4:**

```typescript
import tailwindcss from "npm:tailwindcss";

const { build, registerDevServer } = pages({
  siteMetadata: { ... },
  postCss: {
    plugins: [tailwindcss]
  }
});
```

**With Autoprefixer:**

```typescript
import autoprefixer from "npm:autoprefixer";

const { build, registerDevServer } = pages({
  siteMetadata: { ... },
  postCss: {
    plugins: [autoprefixer]
  }
});
```

**Why programmatic config:**

- No extra config files to manage
- Type-safe configuration
- Easier to share/reuse across projects
- Import plugins directly in your build script
- Simpler mental model (everything in one place)

### 3. Development Mode

**Behavior:**

- Watch `.css` files in `/public` for changes
- Process through PostCSS on change
- Serve processed CSS in-memory (no disk writes)
- Trigger hot reload when CSS changes
- Cache processed results to avoid reprocessing unchanged files

**Watch strategy:**

- Watch all `.css` files in `/public` for CSS changes
- Watch content files (`/pages`, `/layouts`, `/islands`) for class usage changes
- When CSS file changes: rebuild that specific file
- When content file changes: rebuild all CSS (Tailwind needs to rescan for
  classes)
- If build script changes, user restarts dev server (normal workflow)

**Why watch content files:**

- Tailwind v4 scans markup files to detect class usage
- Adding `class="bg-blue-500"` to a layout requires CSS regeneration
- Without watching content files, new Tailwind classes won't appear until manual
  CSS edit

**Performance:**

- Process CSS files in parallel
- Cache PostCSS AST for incremental builds
- Only reprocess files that actually changed

### 4. Production Build

**Behavior:**

- Process all `.css` files through PostCSS
- Minify processed output (using cssnano or similar)
- Write to `dist/__public/` with hash
- Update asset map with processed CSS paths

**Optimization:**

- CSS minification
- Remove unused CSS (if PurgeCSS/Tailwind configured)
- Source maps (optional, configurable)

### 5. API Changes

**No breaking changes to existing API**

**New optional configuration:**

```typescript
// In pages() factory
const { build, registerDevServer } = pages({
  siteMetadata: { ... },
  postCss: {
    // PostCSS configuration (optional)
    plugins: [],              // Array of PostCSS plugins
    minify: true,             // Minify in production (default: true)
    sourceMaps: false,        // Generate source maps (default: false)
  }
});
```

**Type signature:**

```typescript
interface PostCssConfig {
  plugins: AcceptedPlugin[]; // PostCSS plugins array
  minify?: boolean; // Minify CSS in production
  sourceMaps?: boolean; // Generate source maps
}

interface PagesOptions {
  siteMetadata?: SiteMetadata;
  postCss?: PostCssConfig;
}
```

### 6. File Structure

**New files:**

```
pages/
├── css-processor.ts        # PostCSS processing logic
├── css-watcher.ts          # CSS file watcher for dev mode
└── tests/
    ├── css-processor.test.ts
    └── css-watcher.test.ts
```

**Modified files:**

```
pages/
├── assets.ts               # Add CSS processing step
├── build.ts                # Integrate CSS processing in build
├── dev-server.ts           # Add CSS watching and serving
└── watcher.ts              # Watch CSS files alongside pages
```

## Implementation Steps

### Phase 1: PostCSS Processor Core

1. Create `css-processor.ts`:
   - Accept PostCSS config from options
   - Process CSS through PostCSS programmatically
   - Cache processed results
   - Handle errors gracefully

2. Add PostCSS dependencies:
   - `postcss` (peer dependency)
   - Optional: `cssnano` for minification (if not using Lightning CSS)

3. Write tests for processing with various plugin configs

### Phase 2: Development Mode Integration

1. Create `css-watcher.ts`:
   - Watch `.css` files in `/public`
   - Watch content files in `/pages`, `/layouts`, `/islands` (for Tailwind)
   - Track file changes
   - Trigger appropriate CSS reprocessing:
     - CSS file change: rebuild that file only
     - Content file change: rebuild all CSS (Tailwind rescan)

2. Modify `dev-server.ts`:
   - Process CSS before serving
   - Store processed CSS in-memory
   - Serve processed CSS instead of raw files

3. Update `watcher.ts`:
   - Add CSS and content files to watch list
   - Trigger hot reload on any CSS/content changes

4. Write integration tests for dev mode

### Phase 3: Build Mode Integration

1. Modify `build.ts`:
   - Process all CSS files through PostCSS
   - Minify if configured
   - Write to `dist/__public/`

2. Update `assets.ts`:
   - Process CSS before hashing
   - Map clean URLs to processed/hashed URLs

3. Write integration tests for build mode

### Phase 4: Configuration & API

1. Add `PostCssConfig` interface to `types.ts`
2. Update `PagesOptions` to include optional `postCss` field
3. Update `pages()` factory to accept and pass through config
4. Add TypeScript types and JSDoc documentation

### Phase 5: Documentation & Examples

1. Update README with PostCSS section
2. Create example with Tailwind integration
3. Create example with custom PostCSS plugins
4. Document common configurations
5. Add troubleshooting guide

## Dependencies

**Required (peer dependencies):**

- `postcss` - Core PostCSS library

**Optional (user installs and configures as needed):**

- `tailwindcss` - For Tailwind users
- `autoprefixer` - For vendor prefixes
- `cssnano` - For minification
- `postcss-preset-env` - For modern CSS features
- Any other PostCSS plugin

**Deno compatibility:**

- All dependencies work with Deno via npm specifiers
- Users import plugins: `import tailwindcss from "npm:tailwindcss"`
- Test with `npm:postcss`, `npm:tailwindcss`, etc.

## Configuration Examples

### Tailwind CSS

**Install dependencies:**

```bash
deno add npm:tailwindcss npm:postcss
```

**Configure in build script:**

```typescript
// docs/build.ts (or dev.ts)
import { pages } from "@mage/app/pages";
import tailwindcss from "npm:tailwindcss";

const { build } = pages({
  siteMetadata: {
    baseUrl: "https://example.com",
    title: "My Site",
  },
  postCss: {
    plugins: [tailwindcss],
  },
});

await build({ rootDir: "./docs" });
```

**Add Tailwind to your CSS:**

```css
/* public/styles.css */
@import "tailwindcss";

/* Your custom styles here */
```

**That's it!** Tailwind v4 auto-detects your markup files and works out of the
box.

### Autoprefixer

**Install dependencies:**

```bash
deno add npm:autoprefixer npm:postcss
```

**Configure in build script:**

```typescript
import { pages } from "@mage/app/pages";
import autoprefixer from "npm:autoprefixer";

const { build } = pages({
  siteMetadata: { ... },
  postCss: {
    plugins: [autoprefixer],
  },
});

await build({ rootDir: "./docs" });
```

### Custom Build Pipeline

**Configure with environment-based plugins:**

```typescript
import { pages } from "@mage/app/pages";
import autoprefixer from "npm:autoprefixer";
import cssnano from "npm:cssnano";

const isDev = Deno.env.get("DEV") === "true";

const { build } = pages({
  siteMetadata: { ... },
  postCss: {
    plugins: [
      autoprefixer(),
      !isDev && cssnano(),
    ].filter(Boolean),
  },
});

await build({ rootDir: "./docs" });
```

## Error Handling

**Common scenarios:**

1. **PostCSS config has errors:**
   - Show clear error message
   - Point to config file location
   - Suggest fixes

2. **CSS syntax errors:**
   - Show file, line, column
   - Display code snippet
   - Don't crash dev server

3. **Plugin import errors:**
   - Show clear error if plugin import fails
   - Suggest installation command
   - Point to plugin in imports array

4. **Processing timeout:**
   - Warn if processing takes >5s
   - Allow configuration of timeout
   - Show which file is slow

## Performance Considerations

**Development:**

- Process only changed CSS files
- Cache PostCSS AST between builds
- Parallel processing for multiple files
- In-memory serving (no disk I/O)

**Production:**

- Parallel processing of all CSS files
- Minification as final step
- Source maps optional (disabled by default)
- Hash after processing for cache-busting

**Benchmarks to track:**

- Cold start processing time
- Incremental rebuild time
- Build time with 10, 50, 100 CSS files
- Memory usage during processing

## Open Questions

1. **Source maps in production?**
   - Default to disabled (smaller files)
   - Allow opt-in via config
   - Generate inline or external?

2. **CSS import resolution:**
   - Should we handle `@import` specially?
   - Let PostCSS handle it via postcss-import?
   - Document that users should add plugin?

3. **Hot reload granularity:**
   - Full page reload on CSS/content change? ✓ Start here
   - CSS hot swap without reload? - Nice to have
   - Smart reload: only reload if CSS actually changed after processing?

4. **Cache invalidation:**
   - Config changes require dev server restart (acceptable - normal workflow)
   - CSS file changes trigger rebuild of that file
   - Content file changes trigger rebuild of all CSS (Tailwind rescan)
   - Plugin changes in build script require restart

5. **Watch performance:**
   - Watching many content files could be slow
   - Use efficient file watcher (Deno.watchFs)
   - Debounce rapid changes (e.g., save multiple files)
   - Only rebuild CSS if content actually uses PostCSS plugins that scan content

6. **Error recovery:**
   - Serve last known good CSS on error?
   - Serve empty CSS on error?
   - Block serving until fixed?

## Future Enhancements

- Lightning CSS integration (faster alternative to PostCSS)
- CSS modules support
- CSS-in-JS extraction
- Critical CSS generation
- Unused CSS detection and warnings
- Bundle size reporting
- Per-route CSS code splitting
- Preload/prefetch hints generation

## Success Criteria

- User adds Tailwind config to their project
- Pages module automatically detects and processes CSS
- Development mode shows CSS changes immediately
- Production build outputs optimized, minified CSS
- No breaking changes to existing API
- Works with any PostCSS plugin
- Clear error messages for common issues
- Performance overhead is minimal (<100ms for typical CSS)

## Migration Path

**Existing users (no PostCSS):**

- No changes required
- CSS files work exactly as before
- Opt-in by adding `postCss` config to `pages()` options

**New users with Tailwind:**

1. Install: `deno add npm:tailwindcss npm:postcss`
2. Import plugin in build script: `import tailwindcss from "npm:tailwindcss"`
3. Add to `pages({ postCss: { plugins: [tailwindcss] } })`
4. Add `@import "tailwindcss";` to CSS file
5. Done!

**Benefits of programmatic config:**

- No extra config files (`postcss.config.js` not needed)
- Everything in one place (build/dev scripts)
- Type-safe imports and configuration
- Easier to understand and debug
- Simpler project structure

**Documentation needed:**

- API reference for `postCss` option
- Quick start for Tailwind (programmatic config)
- Examples for common PostCSS plugins
- Troubleshooting common issues
