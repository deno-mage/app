import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { LinearRouter } from "../../linear-router.ts";

describe("LinearRouter - HTTP methods - PUT", () => {
  it("should match PUT request", () => {
    const router = new LinearRouter();
    router.put("/", () => {});

    const result = router.match(new URL("http://localhost/"), "PUT");

    expect(result.matchedRoutename).toBe(true);
    expect(result.matchedMethod).toBe(true);
    expect(result.middleware.length).toBe(1);
  });

  it("should not match GET request", () => {
    const router = new LinearRouter();
    router.put("/", () => {});

    const result = router.match(new URL("http://localhost/"), "GET");

    expect(result.matchedRoutename).toBe(true);
    expect(result.matchedMethod).toBe(false);
    expect(result.middleware.length).toBe(0);
  });
});
