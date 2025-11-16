import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { serveFiles } from "../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";
import { resolve } from "@std/path";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get(
    "/no-wildcard",
    serveFiles({ directory: resolve(Deno.cwd(), "test-utils/files") }),
  );

  server.app.get(
    "/public/*",
    serveFiles({ directory: resolve(Deno.cwd(), "test-utils/files") }),
  );

  server.app.get(
    "/no-serve-index/*",
    serveFiles({
      directory: resolve(Deno.cwd(), "public"),
      serveIndex: false,
    }),
  );

  server.app.all(
    "/all/*",
    serveFiles({ directory: resolve(Deno.cwd(), "test-utils/files") }),
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("serve file", () => {
  it("should return 404 when file does not exist", async () => {
    const response = await fetch(server.url("/public/does-not-exist"), {
      method: "GET",
    });

    expect(response.status).toBe(404);
    expect(await response.text()).toEqual("Not Found");
  });

  it("should return file when it exists (json)", async () => {
    const response = await fetch(server.url("/public/hello.json"), {
      method: "GET",
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toEqual(
      await Deno.readTextFile(
        resolve(Deno.cwd(), "test-utils/files/hello.json"),
      ),
    );
    expect(response.headers.get("content-type")).toEqual(
      "application/json; charset=UTF-8",
    );
  });

  it("should return file when it exists (image)", async () => {
    const response = await fetch(server.url("/public/image.png"), {
      method: "GET",
    });

    expect(response.status).toBe(200);
    const data = await Deno.readFile(
      resolve(Deno.cwd(), "./test-utils/files/image.png"),
    );
    expect(await response.arrayBuffer()).toEqual(data.buffer);
    expect(response.headers.get("content-type")).toEqual("image/png");
  });

  it("should return file when it exists (html)", async () => {
    const response = await fetch(server.url("/public/index.html"), {
      method: "GET",
    });

    const data = await Deno.readTextFile(
      resolve(Deno.cwd(), "test-utils/files/index.html"),
    );
    expect(response.status).toBe(200);
    expect(await response.text()).toEqual(data);
    expect(response.headers.get("content-type")).toEqual(
      "text/html; charset=UTF-8",
    );
  });

  it("should default to serving index.html when path is a directory", async () => {
    const response = await fetch(server.url("/public"), {
      method: "GET",
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toEqual(
      await Deno.readTextFile(
        resolve(Deno.cwd(), "test-utils/files/index.html"),
      ),
    );
    expect(response.headers.get("content-type")).toEqual(
      "text/html; charset=UTF-8",
    );
  });

  it("should return 404 when path is a directory and serveIndex is false", async () => {
    const response = await fetch(server.url("/no-serve-index"), {
      method: "GET",
    });

    expect(response.status).toBe(404);
    expect(await response.text()).toEqual("Not Found");
  });

  for (
    const method of [
      "DELETE",
      "PATCH",
      "POST",
      "PUT",
    ]
  ) {
    it(`should not serve on ${method} requests`, async () => {
      const response = await fetch(server.url("/all/hello.json"), {
        method,
      });

      expect(response.status).toBe(405);
      expect(await response.text()).toEqual("Method Not Allowed");
    });
  }

  it("should return internal server error if not configured on wildcard path", async () => {
    const response = await fetch(server.url("/no-wildcard"), {
      method: "GET",
    });

    expect(response.status).toBe(500);
    expect(await response.text()).toEqual("Internal Server Error");
  });

  it("should prevent path traversal attacks", async () => {
    const response = await fetch(
      server.url("/public/../../deno.json"),
      {
        method: "GET",
      },
    );

    expect(response.status).toBe(404);
    expect(await response.text()).toEqual("Not Found");
  });

  it("should serve file when requesting without .html extension", async () => {
    const response = await fetch(server.url("/public/index"), {
      method: "GET",
    });

    const data = await Deno.readTextFile(
      resolve(Deno.cwd(), "test-utils/files/index.html"),
    );
    expect(response.status).toBe(200);
    expect(await response.text()).toEqual(data);
    expect(response.headers.get("content-type")).toEqual(
      "text/html; charset=UTF-8",
    );
  });

  it("should prioritize exact match over .html extension", async () => {
    // If both "hello.json" and "hello.json.html" existed, "hello.json" should be served
    const response = await fetch(server.url("/public/hello.json"), {
      method: "GET",
    });

    expect(response.status).toBe(200);
    await response.text(); // Consume response body
    expect(response.headers.get("content-type")).toEqual(
      "application/json; charset=UTF-8",
    );
  });

  it("should prevent path traversal with .html extension", async () => {
    const response = await fetch(
      server.url("/public/../../../deno"),
      {
        method: "GET",
      },
    );

    expect(response.status).toBe(404);
    expect(await response.text()).toEqual("Not Found");
  });
});
