import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { LinearRouter } from "../linear-router.ts";
import { MageError } from "../../app/error.ts";

describe("LinearRouter - security: path traversal in route parameters", () => {
  it("should allow normal parameter values", () => {
    const router = new LinearRouter();
    router.get("/:filename", () => {});

    const result = router.match(
      new URL("http://localhost/test.txt"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.params).toEqual({ filename: "test.txt" });
  });

  it("should block path traversal in parameter value (../)", () => {
    const router = new LinearRouter();
    router.get("/:filename", () => {});

    expect(() => {
      router.match(new URL("http://localhost/%2E%2E%2Fetc%2Fpasswd"), "GET");
    }).toThrow(MageError);
  });

  it("should block Windows path traversal in parameter (..\\)", () => {
    const router = new LinearRouter();
    router.get("/:filename", () => {});

    expect(() => {
      router.match(
        new URL("http://localhost/%2E%2E%5Cwindows%5Csystem32"),
        "GET",
      );
    }).toThrow(MageError);
  });

  it("should block double-encoded path traversal", () => {
    const router = new LinearRouter();
    router.get("/:filename", () => {});

    expect(() => {
      router.match(
        new URL("http://localhost/%252E%252E%2Fetc%2Fpasswd"),
        "GET",
      );
    }).toThrow(MageError);
  });

  it("should block mixed case path traversal (../ variants)", () => {
    const router = new LinearRouter();
    router.get("/:filename", () => {});

    expect(() => {
      router.match(new URL("http://localhost/%2e%2e%2Froot"), "GET");
    }).toThrow(MageError);
  });

  it("should properly decode safe URL encoded values", () => {
    const router = new LinearRouter();
    router.get("/:filename", () => {});

    const result = router.match(
      new URL("http://localhost/hello%20world.txt"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.params).toEqual({ filename: "hello world.txt" });
  });

  it("should handle special characters without path traversal", () => {
    const router = new LinearRouter();
    router.get("/:filename", () => {});

    const result = router.match(
      new URL("http://localhost/file-name_123.txt"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.params).toEqual({ filename: "file-name_123.txt" });
  });

  it("should block path traversal in nested route parameters", () => {
    const router = new LinearRouter();
    router.get("/user/:id/profile", () => {});

    expect(() => {
      router.match(
        new URL("http://localhost/user/%2E%2E%2Fadmin/profile"),
        "GET",
      );
    }).toThrow(MageError);
  });

  it("should handle dots in filenames that are not traversal", () => {
    const router = new LinearRouter();
    router.get("/:filename", () => {});

    const result = router.match(
      new URL("http://localhost/file.name.with.dots.txt"),
      "GET",
    );

    expect(result.matchedRoutename).toBe(true);
    expect(result.params).toEqual({ filename: "file.name.with.dots.txt" });
  });

  it("should block backward slash encoded traversal", () => {
    const router = new LinearRouter();
    router.get("/:filename", () => {});

    expect(() => {
      router.match(new URL("http://localhost/%2E%2E%5Cparent"), "GET");
    }).toThrow(MageError);
  });
});
