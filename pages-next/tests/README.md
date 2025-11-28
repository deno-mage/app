# Pages-Next Tests

Comprehensive test suite for the pages-next module Phase 1 implementation.

## Test Files

### context.test.tsx

Tests for the FrontmatterContext and useFrontmatter hook.

**Coverage:**

- FrontmatterProvider renders children correctly
- FrontmatterProvider passes frontmatter through context
- Nested providers (inner value takes precedence)
- Custom frontmatter fields with type parameters
- Frontmatter without optional description field
- useFrontmatter throws when used outside provider
- useFrontmatter provides helpful error messages
- useFrontmatter returns frontmatter when inside provider
- Type parameter support for typed frontmatter
- Deep nesting of components accessing frontmatter

**Test Count:** 11 tests

### scanner.test.ts

Tests for directory scanning functions.

**scanSystemFiles Coverage:**

- Discovers _html.tsx at root
- Discovers _not-found.tsx at root
- Discovers _error.tsx at root
- Discovers _layout.tsx at root
- Discovers _layout.tsx in nested directories
- Discovers and sorts multiple layouts by depth
- Discovers all system files together
- Returns empty result for non-existent directories
- Ignores non-tsx files
- Only finds root-level system files at root (not nested)

**scanPages Coverage:**

- Discovers markdown (.md) files
- Discovers TSX (.tsx) files
- Excludes files starting with underscore
- Excludes files in directories starting with underscore
- Discovers nested pages in subdirectories
- Converts index.md to root path (/)
- Converts nested index files to parent path
- Discovers multiple pages
- Returns empty array for non-existent directories
- Ignores non-md and non-tsx files

**getLayoutsForPage Coverage:**

- Returns empty array when no layouts exist
- Returns root layout for root page
- Returns root layout for top-level page
- Returns layouts from root to page directory (ordered)
- Skips missing intermediate layouts
- Does not include layouts deeper than page directory
- Handles page directory with leading slash
- Handles page directory with trailing slash
- Handles deeply nested page directories
- Does not include sibling layouts

**getPageDirectory Coverage:**

- Returns empty string for root path (/)
- Returns empty string for top-level pages
- Returns parent directory for nested pages
- Returns correct parent for deeply nested pages
- Handles paths without leading slash
- Handles deeply nested paths
- Handles single segment after root

**Test Count:** 41 tests

### defaults.test.tsx

Tests for default component rendering.

**_html.tsx Coverage:**

- Renders with title and children
- Renders with title, description, and children
- Does not render description meta tag when undefined
- Includes viewport meta tag
- Wraps children in app div
- Renders head content when provided
- Handles multiple children
- Sets lang attribute to "en"
- Renders with empty description string

**_layout.tsx Coverage:**

- Renders children without wrapper (pass-through)
- Passes through multiple children
- Passes through nested components
- Handles string children
- Handles mixed children types

**_not-found.tsx Coverage:**

- Renders 404 message
- Has correct frontmatter export
- Exports frontmatter object
- Renders complete HTML structure

**_error.tsx Coverage:**

- Renders error message without details
- Renders with custom status code
- Does not show error details in production
- Shows error details in development
- Shows error message when no stack trace
- Has correct frontmatter export
- Exports frontmatter object
- Handles undefined error gracefully
- Defaults to status code 500
- Renders complete HTML structure
- Handles error with only message property

**Test Count:** 33 tests

## Running Tests

Run all pages-next tests:

```bash
deno test pages-next/tests/ --allow-all
```

Run specific test file:

```bash
deno test pages-next/tests/context.test.tsx --allow-all
deno test pages-next/tests/scanner.test.ts --allow-all
deno test pages-next/tests/defaults.test.tsx --allow-all
```

## Total Coverage

- **Total Tests:** 86 test cases across 3 test files
- **All tests passing:** ✓

## Test Patterns

Tests follow black-box testing principles:

- Test behavior, not implementation
- Use realistic data (no "foo", "bar")
- Arrange-Act-Assert pattern
- Descriptive test names
- Proper cleanup (temp directories in finally blocks)
- Mock only at boundaries (filesystem for scanner tests)
