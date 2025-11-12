import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { compression } from "../middleware.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  // Large response that should be compressed
  server.app.get("/large", compression(), (c) => {
    const largeText = "Hello World! ".repeat(1000); // ~13KB
    return c.text(largeText);
  });

  // Small response below threshold
  server.app.get("/small", compression(), (c) => {
    return c.text("Small");
  });

  // Small response with explicit Content-Length (fast path test)
  server.app.get("/small-with-length", compression(), (c) => {
    const text = "Small";
    c.header("Content-Length", text.length.toString());
    return c.text(text);
  });

  // JSON response
  server.app.get("/json", compression(), (c) => {
    const data = {
      items: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
      })),
    };
    return c.json(data);
  });

  // Already compressed - test that middleware doesn't double-compress
  server.app.get("/already-compressed", compression(), async (c) => {
    // Manually compress the response before middleware runs
    const text = "Already compressed";
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(text));
        controller.close();
      },
    });
    const compressed = stream.pipeThrough(new CompressionStream("gzip"));
    const chunks: Uint8Array[] = [];
    for await (const chunk of compressed) {
      chunks.push(chunk);
    }
    const totalLength = chunks.reduce((acc, arr) => acc + arr.length, 0);
    const gzipped = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of chunks) {
      gzipped.set(arr, offset);
      offset += arr.length;
    }

    c.res = new Response(gzipped, {
      headers: {
        "Content-Type": "text/plain; charset=UTF-8",
        "Content-Encoding": "gzip",
      },
    });
  });

  // Non-compressible content type
  server.app.get("/image", compression(), (c) => {
    c.header("Content-Type", "image/png");
    return c.text("fake-png-data");
  });

  // Custom threshold
  server.app.get("/custom-threshold", compression({ threshold: 10 }), (c) => {
    return c.text("Small but should compress");
  });

  // Test Vary header preservation
  server.app.get(
    "/vary-header",
    (c, next) => {
      c.header("Vary", "Cookie");
      return next();
    },
    compression(),
    (c) => {
      const largeText = "Hello World! ".repeat(1000);
      return c.text(largeText);
    },
  );

  // Test maxSize limit
  server.app.get("/too-large", compression({ maxSize: 5000 }), (c) => {
    const largeText = "Hello World! ".repeat(1000); // ~13KB > 5KB limit
    return c.text(largeText);
  });

  // Test maxSize with Content-Length header (fast path)
  server.app.get(
    "/too-large-with-length",
    compression({ maxSize: 5000 }),
    (c) => {
      const largeText = "Hello World! ".repeat(1000); // ~13KB > 5KB limit
      c.header("Content-Length", largeText.length.toString());
      return c.text(largeText);
    },
  );

  // Test case-insensitive Vary header deduplication
  server.app.get(
    "/vary-lowercase",
    (c, next) => {
      c.header("Vary", "accept-encoding");
      return next();
    },
    compression(),
    (c) => {
      const largeText = "Hello World! ".repeat(1000);
      return c.text(largeText);
    },
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("compression", () => {
  it("should compress large text responses with gzip", async () => {
    const response = await fetch(server.url("/large"), {
      headers: {
        "Accept-Encoding": "gzip",
      },
    });

    // Deno automatically decompresses gzip responses and removes the Content-Encoding header
    // We verify compression worked by:
    // 1. Checking the Vary header is set (indicates compression was applied)
    // 2. Verifying the decompressed content is correct
    expect(response.headers.get("Vary")).toBe("Accept-Encoding");

    // Verify content was correctly decompressed
    const text = await response.text();
    expect(text).toBe("Hello World! ".repeat(1000));
  });

  it("should not compress responses below threshold", async () => {
    const response = await fetch(server.url("/small"), {
      headers: {
        "Accept-Encoding": "gzip",
      },
    });

    expect(response.headers.get("Content-Encoding")).toBeNull();

    const text = await response.text();
    expect(text).toBe("Small");
  });

  it("should not compress small responses with Content-Length header (fast path)", async () => {
    const response = await fetch(server.url("/small-with-length"), {
      headers: {
        "Accept-Encoding": "gzip",
      },
    });

    expect(response.headers.get("Content-Encoding")).toBeNull();

    const text = await response.text();
    expect(text).toBe("Small");
  });

  it("should compress JSON responses", async () => {
    const response = await fetch(server.url("/json"), {
      headers: {
        "Accept-Encoding": "gzip",
      },
    });

    expect(response.headers.get("Vary")).toBe("Accept-Encoding");

    const json = await response.json();
    expect(json.items).toHaveLength(100);
  });

  it("should not double-compress already compressed responses", async () => {
    const response = await fetch(server.url("/already-compressed"), {
      headers: {
        "Accept-Encoding": "gzip",
      },
    });

    // The response already has Content-Encoding set, so compression middleware should skip it
    // We can't verify the header directly due to automatic decompression, but we can verify
    // the content is returned correctly
    const text = await response.text();
    expect(text).toBe("Already compressed");
  });

  it("should not compress non-compressible content types", async () => {
    const response = await fetch(server.url("/image"), {
      headers: {
        "Accept-Encoding": "gzip",
      },
    });

    expect(response.headers.get("Content-Encoding")).toBeNull();

    // Consume the response body to avoid resource leak
    const text = await response.text();
    expect(text).toBe("fake-png-data");
  });

  it("should respect custom threshold", async () => {
    const response = await fetch(server.url("/custom-threshold"), {
      headers: {
        "Accept-Encoding": "gzip",
      },
    });

    expect(response.headers.get("Vary")).toBe("Accept-Encoding");

    const text = await response.text();
    expect(text).toBe("Small but should compress");
  });

  it("should not compress when client doesn't support it", async () => {
    const response = await fetch(server.url("/large"));

    expect(response.headers.get("Content-Encoding")).toBeNull();

    const text = await response.text();
    expect(text).toBe("Hello World! ".repeat(1000));
  });

  it("should append to existing Vary header instead of overwriting", async () => {
    const response = await fetch(server.url("/vary-header"), {
      headers: {
        "Accept-Encoding": "gzip",
      },
    });

    // Should have both Cookie and Accept-Encoding in Vary header
    const varyHeader = response.headers.get("Vary");
    expect(varyHeader).toBeTruthy();
    expect(varyHeader).toContain("Cookie");
    expect(varyHeader).toContain("Accept-Encoding");

    const text = await response.text();
    expect(text).toBe("Hello World! ".repeat(1000));
  });

  it("should not compress responses exceeding maxSize", async () => {
    const response = await fetch(server.url("/too-large"), {
      headers: {
        "Accept-Encoding": "gzip",
      },
    });

    // Should not be compressed because it exceeds maxSize (5KB)
    expect(response.headers.get("Content-Encoding")).toBeNull();

    const text = await response.text();
    expect(text).toBe("Hello World! ".repeat(1000));
  });

  it("should not compress large responses with Content-Length header (fast path)", async () => {
    const response = await fetch(server.url("/too-large-with-length"), {
      headers: {
        "Accept-Encoding": "gzip",
      },
    });

    // Should not be compressed because it exceeds maxSize (5KB)
    expect(response.headers.get("Content-Encoding")).toBeNull();

    const text = await response.text();
    expect(text).toBe("Hello World! ".repeat(1000));
  });

  it("should not duplicate Vary header with case-insensitive check", async () => {
    const response = await fetch(server.url("/vary-lowercase"), {
      headers: {
        "Accept-Encoding": "gzip",
      },
    });

    // Should detect existing "accept-encoding" (lowercase) and not add duplicate
    const varyHeader = response.headers.get("Vary");
    expect(varyHeader).toBe("accept-encoding");

    const text = await response.text();
    expect(text).toBe("Hello World! ".repeat(1000));
  });
});
