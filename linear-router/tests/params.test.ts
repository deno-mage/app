import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { LinearRouter } from "../linear-router.ts";

describe("LinearRouter - params", () => {
  it("should match route with single param", () => {
    const router = new LinearRouter();
    router.get("/book/:id", () => {});

    const result = router.match(new URL("http://localhost/book/123"), "GET");

    expect(result.matchedRoutename).toBe(true);
    expect(result.matchedMethod).toBe(true);
    expect(result.params).toEqual({ id: "123" });
    expect(result.middleware.length).toBe(1);
  });

  it("should match route with multiple consecutive params", () => {
    const router = new LinearRouter();
    router.get("/countries/:country/:city/:road", () => {});

    const result = router.match(
      new URL("http://localhost/countries/usa/new-york/5th-avenue"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.matchedMethod).toBe(true);
    expect(result.params).toEqual({
      country: "usa",
      city: "new-york",
      road: "5th-avenue",
    });
  });

  it("should match route with multiple detached params", () => {
    const router = new LinearRouter();
    router.get("/user/:id/post/:postId", () => {});

    const result = router.match(
      new URL("http://localhost/user/42/post/99"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.matchedMethod).toBe(true);
    expect(result.params).toEqual({
      id: "42",
      postId: "99",
    });
  });

  it("should decode URL encoded parameter values", () => {
    const router = new LinearRouter();
    router.get("/file/:name", () => {});

    const result = router.match(
      new URL("http://localhost/file/hello%20world.txt"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.params).toEqual({ name: "hello world.txt" });
  });

  it("should not match when param count doesn't match", () => {
    const router = new LinearRouter();
    router.get("/user/:id", () => {});

    const result = router.match(
      new URL("http://localhost/user/42/extra"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(false);
    expect(result.params).toEqual({});
  });
});
