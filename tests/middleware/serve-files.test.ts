import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import {
  HttpMethod,
  StatusCode,
  StatusText,
  useServeFiles,
} from "../../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";
import { resolve } from "@std/path";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get(
    "/no-wildcard",
    useServeFiles({ directory: resolve(Deno.cwd(), "public") }),
  );

  server.app.get(
    "/public/*",
    useServeFiles({ directory: resolve(Deno.cwd(), "public") }),
  );

  server.app.get(
    "/no-serve-index/*",
    useServeFiles({
      directory: resolve(Deno.cwd(), "public"),
      serveIndex: false,
    }),
  );

  server.app.all(
    "/all/*",
    useServeFiles({ directory: resolve(Deno.cwd(), "public") }),
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("middleware - serve file", () => {
  it("should return 404 when file does not exist", async () => {
    const response = await fetch(server.url("/public/does-not-exist"), {
      method: "GET",
    });

    expect(response.status).toBe(StatusCode.NotFound);
    expect(await response.text()).toEqual(StatusText.NotFound);
  });

  it("should return file when it exists (json)", async () => {
    const response = await fetch(server.url("/public/hello.json"), {
      method: "GET",
    });

    expect(response.status).toBe(StatusCode.OK);
    expect(await response.text()).toEqual(
      await Deno.readTextFile(resolve(Deno.cwd(), "public/hello.json")),
    );
    expect(response.headers.get("content-type")).toEqual(
      "application/json; charset=UTF-8",
    );
  });

  it("should return file when it exists (image)", async () => {
    const response = await fetch(server.url("/public/image.png"), {
      method: "GET",
    });

    expect(response.status).toBe(StatusCode.OK);
    const data = await Deno.readFile(resolve(Deno.cwd(), "./public/image.png"));
    expect(await response.arrayBuffer()).toEqual(data.buffer);
    expect(response.headers.get("content-type")).toEqual("image/png");
  });

  it("should return file when it exists (html)", async () => {
    const response = await fetch(server.url("/public/index.html"), {
      method: "GET",
    });

    expect(response.status).toBe(StatusCode.OK);
    expect(await response.text()).toEqual(
      await Deno.readTextFile(resolve(Deno.cwd(), "public/index.html")),
    );
    expect(response.headers.get("content-type")).toEqual(
      "text/html; charset=UTF-8",
    );
  });

  it("should default to serving index.html when path is a directory", async () => {
    const response = await fetch(server.url("/public"), {
      method: "GET",
    });

    expect(response.status).toBe(StatusCode.OK);
    expect(await response.text()).toEqual(
      await Deno.readTextFile(resolve(Deno.cwd(), "public/index.html")),
    );
    expect(response.headers.get("content-type")).toEqual(
      "text/html; charset=UTF-8",
    );
  });

  it("should return 404 when path is a directory and serveIndex is false", async () => {
    const response = await fetch(server.url("/no-serve-index"), {
      method: "GET",
    });

    expect(response.status).toBe(StatusCode.NotFound);
    expect(await response.text()).toEqual(StatusText.NotFound);
  });

  for (
    const method of [
      HttpMethod.Delete,
      HttpMethod.Patch,
      HttpMethod.Post,
      HttpMethod.Put,
    ]
  ) {
    it(`should not serve on ${method} requests`, async () => {
      const response = await fetch(server.url("/all/hello.json"), {
        method,
      });

      expect(response.status).toBe(StatusCode.MethodNotAllowed);
      expect(await response.text()).toEqual(StatusText.MethodNotAllowed);
    });
  }

  it("should return internal server error if not configured on wildcard path", async () => {
    const response = await fetch(server.url("/no-wildcard"), {
      method: "GET",
    });

    expect(response.status).toBe(StatusCode.InternalServerError);
    expect(await response.text()).toEqual(StatusText.InternalServerError);
  });
});
