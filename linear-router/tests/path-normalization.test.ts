import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { LinearRouter } from "../linear-router.ts";

describe("LinearRouter - path normalization", () => {
  it("should match paths with consecutive slashes (double slash in middle)", () => {
    const router = new LinearRouter();
    router.get("/users/:id", () => {});

    const result = router.match(
      new URL("http://localhost/users//123"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.params).toEqual({ id: "123" });
  });

  it("should match paths with leading double slash", () => {
    const router = new LinearRouter();
    router.get("/users/:id", () => {});

    const result = router.match(
      new URL("http://localhost//users/123"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.params).toEqual({ id: "123" });
  });

  it("should match paths with multiple consecutive slashes", () => {
    const router = new LinearRouter();
    router.get("/users/:id", () => {});

    const result = router.match(
      new URL("http://localhost/users///123"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.params).toEqual({ id: "123" });
  });

  it("should match paths with trailing slash", () => {
    const router = new LinearRouter();
    router.get("/users/:id", () => {});

    const result = router.match(
      new URL("http://localhost/users/123/"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.params).toEqual({ id: "123" });
  });

  it("should normalize static routes with trailing slash", () => {
    const router = new LinearRouter();
    router.get("/users", () => {});

    const result = router.match(new URL("http://localhost/users/"), "GET");

    expect(result.matchedRoutename).toBe(true);
  });

  it("should normalize root path with trailing slash", () => {
    const router = new LinearRouter();
    router.get("/", () => {});

    // Both should match
    const result1 = router.match(new URL("http://localhost/"), "GET");
    const result2 = router.match(new URL("http://localhost"), "GET");

    expect(result1.matchedRoutename).toBe(true);
    expect(result2.matchedRoutename).toBe(true);
  });

  it("should normalize paths with slashes throughout", () => {
    const router = new LinearRouter();
    router.get("/api/users/:id/posts/:postId", () => {});

    const result = router.match(
      new URL("http://localhost//api///users//42//posts/99/"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.params).toEqual({ id: "42", postId: "99" });
  });

  it("should normalize paths for wildcard routes", () => {
    const router = new LinearRouter();
    router.get("/files/*", () => {});

    const result = router.match(
      new URL("http://localhost/files//foo//bar.txt"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.wildcard).toBe("foo/bar.txt");
  });

  it("should normalize paths with wildcard and params", () => {
    const router = new LinearRouter();
    router.get("/docs/:section/*", () => {});

    const result = router.match(
      new URL("http://localhost//docs//api///v1//users.html"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.params).toEqual({ section: "api" });
    expect(result.wildcard).toBe("v1/users.html");
  });

  it("should handle getAvailableMethods with normalized paths", () => {
    const router = new LinearRouter();
    router.get("/users/:id", () => {});
    router.post("/users/:id", () => {});

    const methods = router.getAvailableMethods(
      new URL("http://localhost/users//123/"),
    );

    expect(methods).toContain("GET");
    expect(methods).toContain("HEAD");
    expect(methods).toContain("POST");
  });

  it("should normalize empty path to root", () => {
    const router = new LinearRouter();
    router.get("/", () => {});

    const result = router.match(new URL("http://localhost"), "GET");

    expect(result.matchedRoutename).toBe(true);
  });

  it("should not match different paths after normalization", () => {
    const router = new LinearRouter();
    router.get("/users/:id", () => {});

    const result = router.match(
      new URL("http://localhost//users//123/extra"),
      "GET",
    );

    // After normalization: /users/123/extra (3 segments)
    // Route: /users/:id (2 segments)
    expect(result.matchedRoutename).toBe(false);
  });

  it("should preserve params with special characters after normalization", () => {
    const router = new LinearRouter();
    router.get("/users/:name", () => {});

    const result = router.match(
      new URL("http://localhost//users//john-doe_123/"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.params).toEqual({ name: "john-doe_123" });
  });

  it("should normalize paths with URL-encoded slashes in params", () => {
    const router = new LinearRouter();
    router.get("/files/:filename", () => {});

    // URL encoded slash: %2F should NOT be treated as path separator
    const result = router.match(
      new URL("http://localhost/files/folder%2Ffile.txt"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.params.filename).toBe("folder/file.txt");
  });

  it("should handle multiple trailing slashes", () => {
    const router = new LinearRouter();
    router.get("/users/:id", () => {});

    const result = router.match(
      new URL("http://localhost/users/123///"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.params).toEqual({ id: "123" });
  });
});
