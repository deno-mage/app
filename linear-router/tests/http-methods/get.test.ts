import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { LinearRouter } from "../../linear-router.ts";

describe("LinearRouter - HTTP methods - GET", () => {
  it("should match GET request", () => {
    const router = new LinearRouter();
    router.get("/", () => {});

    const result = router.match(new URL("http://localhost/"), "GET");

    expect(result.matchedRoutename).toBe(true);
    expect(result.matchedMethod).toBe(true);
    expect(result.middleware.length).toBe(1);
  });

  it("should also match HEAD request for GET routes", () => {
    const router = new LinearRouter();
    router.get("/", () => {});

    const result = router.match(new URL("http://localhost/"), "HEAD");

    expect(result.matchedRoutename).toBe(true);
    expect(result.matchedMethod).toBe(true);
    expect(result.middleware.length).toBe(1);
  });

  it("should not match POST request", () => {
    const router = new LinearRouter();
    router.get("/", () => {});

    const result = router.match(new URL("http://localhost/"), "POST");

    expect(result.matchedRoutename).toBe(true);
    expect(result.matchedMethod).toBe(false);
    expect(result.middleware.length).toBe(0);
  });
});
