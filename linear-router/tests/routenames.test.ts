import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { LinearRouter } from "../linear-router.ts";

describe("LinearRouter - route names", () => {
  it("should match base route", () => {
    const router = new LinearRouter();
    router.get("/", () => {});

    const result = router.match(new URL("http://localhost/"), "GET");

    expect(result.matchedRoutename).toBe(true);
    expect(result.matchedMethod).toBe(true);
    expect(result.middleware.length).toBe(1);
  });

  it("should match single segment route", () => {
    const router = new LinearRouter();
    router.get("/one", () => {});

    const result = router.match(new URL("http://localhost/one"), "GET");

    expect(result.matchedRoutename).toBe(true);
    expect(result.matchedMethod).toBe(true);
  });

  it("should match multi-segment route", () => {
    const router = new LinearRouter();
    router.get("/one/two", () => {});

    const result = router.match(new URL("http://localhost/one/two"), "GET");

    expect(result.matchedRoutename).toBe(true);
    expect(result.matchedMethod).toBe(true);
  });

  it("should not match partial routes", () => {
    const router = new LinearRouter();
    router.get("/one/two", () => {});

    const result = router.match(new URL("http://localhost/one"), "GET");

    expect(result.matchedRoutename).toBe(false);
  });

  it("should not match routes with extra segments", () => {
    const router = new LinearRouter();
    router.get("/one", () => {});

    const result = router.match(new URL("http://localhost/one/two"), "GET");

    expect(result.matchedRoutename).toBe(false);
  });

  it("should match exact route among multiple routes", () => {
    const router = new LinearRouter();
    const middleware1 = () => {};
    const middleware2 = () => {};
    const middleware3 = () => {};

    router.get("/", middleware1);
    router.get("/one", middleware2);
    router.get("/one/two", middleware3);

    const result = router.match(new URL("http://localhost/one"), "GET");

    expect(result.matchedRoutename).toBe(true);
    expect(result.middleware).toContain(middleware2);
  });
});
