import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { LinearRouter } from "../linear-router.ts";

describe("LinearRouter - wildcard", () => {
  it("should match wildcard at base path (inclusive)", () => {
    const router = new LinearRouter();
    router.get("/public/*", () => {});

    const result = router.match(new URL("http://localhost/public"), "GET");

    expect(result.matchedRoutename).toBe(true);
    expect(result.matchedMethod).toBe(true);
    expect(result.wildcard).toBe("");
  });

  it("should match wildcard with single segment", () => {
    const router = new LinearRouter();
    router.get("/public/*", () => {});

    const result = router.match(
      new URL("http://localhost/public/wildcard"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.wildcard).toBe("wildcard");
  });

  it("should match wildcard with multiple path segments", () => {
    const router = new LinearRouter();
    router.get("/public/*", () => {});

    const result = router.match(
      new URL("http://localhost/public/js/index.js"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.wildcard).toBe("js/index.js");
  });

  it("should prioritize specific routes over wildcards when registered first", () => {
    const router = new LinearRouter();
    const specificMiddleware = () => {};
    const wildcardMiddleware = () => {};

    router.get("/public/specific", specificMiddleware);
    router.get("/public/*", wildcardMiddleware);

    const result = router.match(
      new URL("http://localhost/public/specific"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.middleware.length).toBe(2); // Both match, but specific is first
    expect(result.middleware[0]).toBe(specificMiddleware);
  });

  it("should match wildcard and extract params together", () => {
    const router = new LinearRouter();
    router.get("/:param/*", () => {});

    const result = router.match(
      new URL("http://localhost/myParam/wildcard/path"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.params).toEqual({ param: "myParam" });
    expect(result.wildcard).toBe("wildcard/path");
  });

  it("should match all remaining segments after wildcard", () => {
    const router = new LinearRouter();
    router.get("/files/*", () => {});

    const result = router.match(
      new URL("http://localhost/files/docs/2024/report.pdf"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.wildcard).toBe("docs/2024/report.pdf");
  });
});
