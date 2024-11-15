import { afterEach, beforeEach, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../main.ts";
import { MageTestServer } from "./utils/server.ts";

let server: MageTestServer;

beforeEach(() => {
  server = new MageTestServer();

  server.app.delete("/", (context) => {
    context.text(StatusCode.OK, "delete");
  });

  server.app.get("/", (context) => {
    context.text(StatusCode.OK, "get");
  });

  server.app.patch("/", (context) => {
    context.text(StatusCode.OK, "patch");
  });

  server.app.post("/", (context) => {
    context.text(StatusCode.OK, "post");
  });

  server.app.put("/", (context) => {
    context.text(StatusCode.OK, "put");
  });

  server.start();
});

afterEach(async () => {
  await server.stop();
});

it("should hit DELETE", async () => {
  const response = await fetch(server.url("/"), {
    method: "DELETE",
  });

  expect(response.status).toBe(StatusCode.OK);
  expect(await response.text()).toBe("delete");
});

it("should hit GET", async () => {
  const response = await fetch(server.url("/"), {
    method: "GET",
  });

  expect(response.status).toBe(StatusCode.OK);
  expect(await response.text()).toBe("get");
});

it("should hit PATCH", async () => {
  const response = await fetch(server.url("/"), {
    method: "PATCH",
  });

  expect(response.status).toBe(StatusCode.OK);
  expect(await response.text()).toBe("patch");
});

it("should hit POST", async () => {
  const response = await fetch(server.url("/"), {
    method: "POST",
  });

  expect(response.status).toBe(StatusCode.OK);
  expect(await response.text()).toBe("post");
});

it("should hit PUT", async () => {
  const response = await fetch(server.url("/"), {
    method: "PUT",
  });

  expect(response.status).toBe(StatusCode.OK);
  expect(await response.text()).toBe("put");
});

it("should return available methods for OPTIONS", async () => {
  const response = await fetch(server.url("/"), {
    method: "OPTIONS",
  });

  expect(response.status).toBe(StatusCode.OK);
  expect(response.headers.get("Allow")).toBe("DELETE, GET, PATCH, POST, PUT");
  expect(await response.text()).toBe("OK");
});
