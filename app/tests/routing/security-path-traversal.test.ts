import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageTestServer } from "../../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/:filename", (c) => {
    c.text(`File: ${c.req.params.filename}`);
  });

  server.app.get("/user/:id/profile", (c) => {
    c.text(`User ID: ${c.req.params.id}`);
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("routing - security: path traversal in route parameters", () => {
  it("should allow normal parameter values", async () => {
    const response = await fetch(server.url("/test.txt"), {
      method: "GET",
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("File: test.txt");
  });

  it("should block path traversal in parameter value (../)", async () => {
    const response = await fetch(server.url("/%2E%2E%2Fetc%2Fpasswd"), {
      method: "GET",
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Bad Request");
  });

  it("should block Windows path traversal in parameter (..\\)", async () => {
    const response = await fetch(server.url("/%2E%2E%5Cwindows%5Csystem32"), {
      method: "GET",
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Bad Request");
  });

  it("should block double-encoded path traversal", async () => {
    // %252E = URL encoded %2E (which decodes to .)
    const response = await fetch(server.url("/%252E%252E%2Fetc%2Fpasswd"), {
      method: "GET",
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Bad Request");
  });

  it("should block mixed case path traversal (../ variants)", async () => {
    const response = await fetch(server.url("/%2e%2e%2Froot"), {
      method: "GET",
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Bad Request");
  });

  it("should properly decode safe URL encoded values", async () => {
    const response = await fetch(server.url("/hello%20world.txt"), {
      method: "GET",
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("File: hello world.txt");
  });

  it("should handle special characters without path traversal", async () => {
    const response = await fetch(server.url("/file-name_123.txt"), {
      method: "GET",
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("File: file-name_123.txt");
  });

  it("should block path traversal in nested route parameters", async () => {
    const response = await fetch(server.url("/user/%2E%2E%2Fadmin/profile"), {
      method: "GET",
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Bad Request");
  });

  it("should handle dots in filenames that are not traversal", async () => {
    const response = await fetch(server.url("/file.name.with.dots.txt"), {
      method: "GET",
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("File: file.name.with.dots.txt");
  });

  it("should block backward slash encoded traversal", async () => {
    const response = await fetch(server.url("/%2E%2E%5Cparent"), {
      method: "GET",
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Bad Request");
  });
});
