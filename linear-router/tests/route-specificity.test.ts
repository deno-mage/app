import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { LinearRouter } from "../linear-router.ts";

describe("LinearRouter - route specificity", () => {
  it("should prioritize static over param routes", () => {
    const router = new LinearRouter();
    const staticMiddleware = () => {};
    const paramMiddleware = () => {};

    // Register param FIRST, static SECOND (reverse order)
    router.get("/users/:id", paramMiddleware);
    router.get("/users/admin", staticMiddleware);

    const result = router.match(new URL("http://localhost/users/admin"), "GET");

    expect(result.middleware.length).toBe(2); // Both match
    expect(result.middleware[0]).toBe(staticMiddleware); // Static wins
  });

  it("should prioritize static over wildcard routes", () => {
    const router = new LinearRouter();
    const staticMiddleware = () => {};
    const wildcardMiddleware = () => {};

    // Register wildcard FIRST, static SECOND
    router.get("/files/*", wildcardMiddleware);
    router.get("/files/index.html", staticMiddleware);

    const result = router.match(
      new URL("http://localhost/files/index.html"),
      "GET",
    );

    expect(result.middleware.length).toBe(2);
    expect(result.middleware[0]).toBe(staticMiddleware); // Static wins
  });

  it("should prioritize param over wildcard routes", () => {
    const router = new LinearRouter();
    const paramMiddleware = () => {};
    const wildcardMiddleware = () => {};

    // Register wildcard FIRST, param SECOND
    router.get("/posts/*", wildcardMiddleware);
    router.get("/posts/:id", paramMiddleware);

    const result = router.match(new URL("http://localhost/posts/123"), "GET");

    expect(result.middleware.length).toBe(2);
    expect(result.middleware[0]).toBe(paramMiddleware); // Param wins over wildcard
  });

  it("should sort by specificity with mixed route types", () => {
    const router = new LinearRouter();
    const staticMiddleware = () => {};
    const paramMiddleware = () => {};
    const wildcardMiddleware = () => {};

    // Register in random order
    router.get("/users/:id", paramMiddleware);
    router.get("/users/*", wildcardMiddleware);
    router.get("/users/admin", staticMiddleware);

    const result = router.match(
      new URL("http://localhost/users/admin"),
      "GET",
    );

    expect(result.middleware.length).toBe(3); // All match
    expect(result.middleware[0]).toBe(staticMiddleware); // Static first
    expect(result.middleware[1]).toBe(paramMiddleware); // Param second
    expect(result.middleware[2]).toBe(wildcardMiddleware); // Wildcard last
  });

  it("should calculate specificity based on all segments", () => {
    const router = new LinearRouter();
    const moreSpecificMiddleware = () => {};
    const lessSpecificMiddleware = () => {};

    // /users/admin/settings = 3 + 3 + 3 = 9 points
    // /users/:id/settings = 3 + 2 + 3 = 8 points
    router.get("/users/:id/settings", lessSpecificMiddleware);
    router.get("/users/admin/settings", moreSpecificMiddleware);

    const result = router.match(
      new URL("http://localhost/users/admin/settings"),
      "GET",
    );

    expect(result.middleware.length).toBe(2);
    expect(result.middleware[0]).toBe(moreSpecificMiddleware);
  });

  it("should preserve registration order for same specificity", () => {
    const router = new LinearRouter();
    const first = () => {};
    const second = () => {};
    const third = () => {};

    // All have same specificity (3 + 2 = 5 points each)
    router.get("/users/:id", first);
    router.get("/posts/:id", second);
    router.get("/files/:name", third);

    const result = router.match(new URL("http://localhost/users/123"), "GET");

    // Only /users/:id should match
    expect(result.middleware.length).toBe(1);
    expect(result.middleware[0]).toBe(first);
  });

  it("should handle deep path specificity", () => {
    const router = new LinearRouter();
    const mostSpecific = () => {};
    const midSpecific = () => {};
    const leastSpecific = () => {};

    // /api/v1/users/admin/profile = 3 * 5 = 15 points
    // /api/v1/users/:id/profile = 3 * 4 + 2 = 14 points
    // /api/v1/users/:id/* = 3 * 3 + 2 + 1 = 12 points
    router.get("/api/v1/users/:id/*", leastSpecific);
    router.get("/api/v1/users/:id/profile", midSpecific);
    router.get("/api/v1/users/admin/profile", mostSpecific);

    const result = router.match(
      new URL("http://localhost/api/v1/users/admin/profile"),
      "GET",
    );

    expect(result.middleware.length).toBe(3);
    expect(result.middleware[0]).toBe(mostSpecific);
    expect(result.middleware[1]).toBe(midSpecific);
    expect(result.middleware[2]).toBe(leastSpecific);
  });

  it("should use params from most specific matching route", () => {
    const router = new LinearRouter();

    // Both routes would match /users/123
    router.get("/users/*", () => {});
    router.get("/users/:userId", () => {});

    const result = router.match(new URL("http://localhost/users/123"), "GET");

    // Should use params from the param route (more specific)
    expect(result.params.userId).toBe("123");
    expect(result.wildcard).toBeUndefined();
  });

  it("should use wildcard from most specific matching route", () => {
    const router = new LinearRouter();

    // /files/public/* is more specific than /files/*
    router.get("/files/*", () => {});
    router.get("/files/public/*", () => {});

    const result = router.match(
      new URL("http://localhost/files/public/image.png"),
      "GET",
    );

    // Should use wildcard from the more specific route
    expect(result.wildcard).toBe("image.png");
  });
});
