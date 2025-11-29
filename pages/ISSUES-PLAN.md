# Dev Server Issues Plan

Issues identified from code review of the pages dev server implementation.

## Critical Issues

### 1. File Watcher Race Condition ✅

**File:** `file-watcher.ts:157-197` **Problem:** Watchers aren't properly closed
on cleanup. The `isRunning` flag only exits on the next FS event, causing
resource leaks. **Fix:** Track watcher instances and call `watcher.close()` in
cleanup function.

### 2. Unhandled WebSocket Errors ✅

**File:** `hot-reload.ts:48-51` **Problem:** Broadcasting to clients doesn't
catch send failures. A client in CLOSING state can crash the server. **Fix:**
Wrap `client.send()` in try-catch and remove dead clients from the Set.

## High Priority Issues

### 3. Bundle Cache Grows Unbounded ✅

**File:** `dev-server.ts:74` **Problem:** No eviction policy, memory leak over
time. **Fix:** Add LRU eviction with max size limit (50 entries) to bundle
cache.

### 4. Styles Cache Ignores Config Changes ✅

**File:** `dev-server.ts:180-212` **Problem:** 1-second cache doesn't check if
`uno.config.ts` was modified. **Fix:** Track config file mtime and invalidate
cache when it changes.

### 5. Missing Symlink Protection ✅

**File:** `dev-server.ts:125-143` **Problem:** `Deno.stat()` follows symlinks,
could serve files outside pages directory. **Fix:** Use `Deno.lstat()` to detect
symlinks, then verify realPath is within pagesDir.

### 6. Cleanup Doesn't Await Async Operations ✅

**File:** `dev-server.ts:504-510` **Problem:** `stopBundleBuilder()` is async
but not awaited, caches not cleared. **Fix:** Make cleanup function async, await
stopBundleBuilder, clear caches.

## Medium Priority Issues

### 7. Bundle ID Collision ✅

**File:** `dev-server.ts:158-162` **Problem:** `/a-b` and `/a/b` both become
`"a-b"`. **Fix:** Use `__` as separator instead of `-`.

### 8. Hard-coded Cache Timing

**File:** `dev-server.ts:188` **Problem:** 1-second styles cache is not
configurable. **Status:** Deferred - acceptable default for development.

### 9. Bundle Middleware O(n) Search

**File:** `dev-server.ts:242-259` **Problem:** Loops through entire cache on
every request. **Status:** Deferred - with 50 entry max, O(n) is acceptable for
dev server.

### 10. Wrong Content-Type for JavaScript ✅

**File:** `dev-server.ts:255` **Problem:** Uses `text/javascript` instead of
`application/javascript`. **Fix:** Changed to `application/javascript` per RFC.

## Test Coverage Gaps

### Tier 1 - Blocking

- [ ] WebSocket connection lifecycle and broadcasting
- [ ] Path traversal security for page resolution
- [ ] Bundle cache invalidation correctness
- [ ] End-to-end hot reload integration

### Tier 2 - High

- [ ] UnoCSS integration and cache management
- [ ] Error recovery and overlay injection
- [ ] File watcher integration with dev server
- [ ] Not-found page error handling

### Tier 3 - Medium

- [ ] Bundle middleware edge cases
- [ ] System files cache refresh
- [ ] Page directory and layout resolution
- [ ] Reconnection behavior

## Implementation Order

1. Fix critical issues (1-2)
2. Fix high priority issues (3-6)
3. Add Tier 1 tests
4. Fix medium priority issues (7-10)
5. Add Tier 2-3 tests
