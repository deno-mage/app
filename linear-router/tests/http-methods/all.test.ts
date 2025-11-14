import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { LinearRouter } from "../../linear-router.ts";

describe("LinearRouter - HTTP methods - all", () => {
  it("should match GET request", () => {
    const router = new LinearRouter();
    router.all("/", () => {});

    const result = router.match(new URL("http://localhost/"), "GET");

    expect(result.matchedRoutename).toBe(true);
    expect(result.matchedMethod).toBe(true);
    expect(result.middleware.length).toBe(1);
  });

  it("should match HEAD request", () => {
    const router = new LinearRouter();
    router.all("/", () => {});

    const result = router.match(new URL("http://localhost/"), "HEAD");

    expect(result.matchedRoutename).toBe(true);
    expect(result.matchedMethod).toBe(true);
    expect(result.middleware.length).toBe(1);
  });

  it("should match POST request", () => {
    const router = new LinearRouter();
    router.all("/", () => {});

    const result = router.match(new URL("http://localhost/"), "POST");

    expect(result.matchedRoutename).toBe(true);
    expect(result.matchedMethod).toBe(true);
    expect(result.middleware.length).toBe(1);
  });

  it("should match PUT request", () => {
    const router = new LinearRouter();
    router.all("/", () => {});

    const result = router.match(new URL("http://localhost/"), "PUT");

    expect(result.matchedRoutename).toBe(true);
    expect(result.matchedMethod).toBe(true);
    expect(result.middleware.length).toBe(1);
  });

  it("should match DELETE request", () => {
    const router = new LinearRouter();
    router.all("/", () => {});

    const result = router.match(new URL("http://localhost/"), "DELETE");

    expect(result.matchedRoutename).toBe(true);
    expect(result.matchedMethod).toBe(true);
    expect(result.middleware.length).toBe(1);
  });

  it("should match PATCH request", () => {
    const router = new LinearRouter();
    router.all("/", () => {});

    const result = router.match(new URL("http://localhost/"), "PATCH");

    expect(result.matchedRoutename).toBe(true);
    expect(result.matchedMethod).toBe(true);
    expect(result.middleware.length).toBe(1);
  });

  it("should match OPTIONS request", () => {
    const router = new LinearRouter();
    router.all("/", () => {});

    const result = router.match(new URL("http://localhost/"), "OPTIONS");

    expect(result.matchedRoutename).toBe(true);
    expect(result.matchedMethod).toBe(true);
    expect(result.middleware.length).toBe(1);
  });
});
