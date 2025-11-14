import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { LinearRouter } from "../linear-router.ts";
import { MageError } from "../../app/error.ts";

describe("LinearRouter - duplicate route validation", () => {
  it("should allow the same route pattern for different HTTP methods", () => {
    const router = new LinearRouter();

    expect(() => {
      router.get("/users", () => {});
      router.post("/users", () => {});
      router.put("/users", () => {});
    }).not.toThrow();
  });

  it("should throw when registering exact duplicate route with same method", () => {
    const router = new LinearRouter();
    router.get("/users/:id", () => {});

    expect(() => {
      router.get("/users/:id", () => {});
    }).toThrow(MageError);
  });

  it("should throw when registering functionally identical route with different param name", () => {
    const router = new LinearRouter();
    router.get("/users/:id", () => {});

    expect(() => {
      router.get("/users/:userId", () => {});
    }).toThrow(MageError);
  });

  it("should throw with descriptive error showing both routes", () => {
    const router = new LinearRouter();
    router.get("/users/:id", () => {});

    let error: unknown;
    try {
      router.get("/users/:userId", () => {});
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(MageError);
    expect((error as MageError).message).toContain("/users/:userId");
    expect((error as MageError).message).toContain("/users/:id");
    expect((error as MageError).message).toContain("GET");
  });

  it("should throw when HEAD method conflicts (GET auto-registers HEAD)", () => {
    const router = new LinearRouter();
    router.get("/users/:id", () => {}); // Registers GET and HEAD

    expect(() => {
      router.head("/users/:userId", () => {}); // HEAD conflicts
    }).toThrow(MageError);
  });

  it("should throw for duplicate routes with multiple params", () => {
    const router = new LinearRouter();
    router.get("/users/:userId/posts/:postId", () => {});

    expect(() => {
      router.get("/users/:id/posts/:pid", () => {});
    }).toThrow(MageError);
  });

  it("should allow different route patterns with params", () => {
    const router = new LinearRouter();

    expect(() => {
      router.get("/users/:id", () => {});
      router.get("/posts/:id", () => {});
      router.get("/users/:id/posts", () => {});
    }).not.toThrow();
  });

  it("should throw when all() method overlaps with specific method", () => {
    const router = new LinearRouter();
    router.get("/users/:id", () => {});

    expect(() => {
      router.all("/users/:userId", () => {}); // all() includes GET
    }).toThrow(MageError);
  });

  it("should throw when specific method overlaps with all()", () => {
    const router = new LinearRouter();
    router.all("/users/:id", () => {});

    expect(() => {
      router.post("/users/:userId", () => {}); // POST is in all()
    }).toThrow(MageError);
  });

  it("should allow duplicate patterns for use() since it has no methods", () => {
    const router = new LinearRouter();

    expect(() => {
      router.use(() => {});
      router.use(() => {});
      router.get("/users", () => {});
    }).not.toThrow();
  });

  it("should allow use() and specific route with params", () => {
    const router = new LinearRouter();

    expect(() => {
      router.use(() => {}); // No routename
      router.get("/users/:id", () => {});
    }).not.toThrow();
  });

  it("should throw for duplicate wildcard routes", () => {
    const router = new LinearRouter();
    router.get("/files/*", () => {});

    expect(() => {
      router.get("/files/*", () => {});
    }).toThrow(MageError);
  });

  it("should allow different wildcard routes", () => {
    const router = new LinearRouter();

    expect(() => {
      router.get("/files/*", () => {});
      router.get("/assets/*", () => {});
    }).not.toThrow();
  });

  it("should throw for static route duplicates", () => {
    const router = new LinearRouter();
    router.get("/users", () => {});

    expect(() => {
      router.get("/users", () => {});
    }).toThrow(MageError);
  });

  it("should throw listing all overlapping methods", () => {
    const router = new LinearRouter();
    router.all("/users/:id", () => {}); // Registers 7 methods

    let error: unknown;
    try {
      router.all("/users/:userId", () => {});
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(MageError);
    const message = (error as MageError).message;
    // Should list multiple overlapping methods
    expect(message).toContain("GET");
    expect(message).toContain("POST");
  });

  it("should allow same pattern for non-overlapping method subsets", () => {
    const router = new LinearRouter();

    expect(() => {
      router.get("/users/:id", () => {}); // GET, HEAD
      router.post("/users/:id", () => {}); // POST
      router.put("/users/:id", () => {}); // PUT
      router.delete("/users/:id", () => {}); // DELETE
      router.patch("/users/:id", () => {}); // PATCH
      router.options("/users/:id", () => {}); // OPTIONS
    }).not.toThrow();
  });
});
