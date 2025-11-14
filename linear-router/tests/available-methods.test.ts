import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { LinearRouter } from "../linear-router.ts";

describe("LinearRouter - getAvailableMethods", () => {
  it("should return empty array when no routes match", () => {
    const router = new LinearRouter();
    router.get("/other", () => {});

    const methods = router.getAvailableMethods(new URL("http://localhost/"));

    expect(methods).toEqual([]);
  });

  it("should return GET and HEAD for a GET route", () => {
    const router = new LinearRouter();
    router.get("/", () => {});

    const methods = router.getAvailableMethods(new URL("http://localhost/"));

    expect(methods).toContain("GET");
    expect(methods).toContain("HEAD");
    expect(methods.length).toBe(2);
  });

  it("should return POST for a POST route", () => {
    const router = new LinearRouter();
    router.post("/", () => {});

    const methods = router.getAvailableMethods(new URL("http://localhost/"));

    expect(methods).toEqual(["POST"]);
  });

  it("should return all methods registered on a route", () => {
    const router = new LinearRouter();
    router.get("/", () => {});
    router.post("/", () => {});
    router.put("/", () => {});

    const methods = router.getAvailableMethods(new URL("http://localhost/"));

    expect(methods).toContain("GET");
    expect(methods).toContain("HEAD");
    expect(methods).toContain("POST");
    expect(methods).toContain("PUT");
    expect(methods.length).toBe(4);
  });

  it("should return all HTTP methods for all() route", () => {
    const router = new LinearRouter();
    router.all("/", () => {});

    const methods = router.getAvailableMethods(new URL("http://localhost/"));

    expect(methods).toContain("GET");
    expect(methods).toContain("HEAD");
    expect(methods).toContain("POST");
    expect(methods).toContain("PUT");
    expect(methods).toContain("DELETE");
    expect(methods).toContain("PATCH");
    expect(methods).toContain("OPTIONS");
    expect(methods.length).toBe(7);
  });

  it("should return methods for parameterized routes", () => {
    const router = new LinearRouter();
    router.get("/user/:id", () => {});
    router.post("/user/:id", () => {});

    const methods = router.getAvailableMethods(
      new URL("http://localhost/user/123"),
    );

    expect(methods).toContain("GET");
    expect(methods).toContain("HEAD");
    expect(methods).toContain("POST");
    expect(methods.length).toBe(3);
  });

  it("should not return methods for routes with use()", () => {
    const router = new LinearRouter();
    router.use(() => {});
    router.get("/", () => {});

    const methods = router.getAvailableMethods(new URL("http://localhost/"));

    // use() doesn't register methods, only get() does
    expect(methods).toEqual(["GET", "HEAD"]);
  });
});
