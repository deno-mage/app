import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "@mage/app";
import { MageTestServer } from "../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.post("/array-buffer", async (context) => {
    context.text(
      StatusCode.OK,
      new TextDecoder().decode(await context.request.arrayBuffer()),
    );
  });

  server.app.post("/blob", async (context) => {
    context.text(StatusCode.OK, await (await context.request.blob()).text());
  });

  server.app.post("/form-data", async (context) => {
    const formData = await context.request.formData();
    context.json(StatusCode.OK, {
      abc: formData.get("abc"),
    });
  });

  server.app.post("/json", async (context) => {
    context.json(
      StatusCode.OK,
      JSON.parse(JSON.stringify(await context.request.json())),
    );
  });

  server.app.post("/text", async (context) => {
    context.text(StatusCode.OK, await context.request.text());
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("body", () => {
  it("should read body - array-buffer", async () => {
    const response = await fetch(server.url("/array-buffer"), {
      method: "POST",
      body: new TextEncoder().encode("array buffer"),
    });

    expect(await response.text()).toBe("array buffer");
  });

  it("should read body - blob", async () => {
    const response = await fetch(server.url("/blob"), {
      method: "POST",
      body: new Blob(["blob"]),
    });

    expect(await response.text()).toBe("blob");
  });

  it("should read body - form-data", async () => {
    const formData = new FormData();
    formData.append("abc", "123");

    const response = await fetch(server.url("/form-data"), {
      method: "POST",
      body: formData,
    });

    expect(await response.json()).toEqual({
      abc: "123",
    });
  });

  it("should read body - json", async () => {
    const response = await fetch(server.url("/json"), {
      method: "POST",
      body: JSON.stringify({
        abc: 123,
      }),
    });

    expect(await response.json()).toEqual({
      abc: 123,
    });
  });

  it("should read body - text", async () => {
    const response = await fetch(server.url("/text"), {
      method: "POST",
      body: "text",
    });

    expect(await response.text()).toBe("text");
  });
});
