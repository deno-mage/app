import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../../../app/mod.ts";
import { MageTestServer } from "../../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.all("/", (context) => {
    context.text(StatusCode.OK, "all");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("routing - HTTP methods - all", () => {
  it("should hit GET", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(response.status).toBe(StatusCode.OK);
    expect(await response.text()).toBe("all");
  });

  it("should hit POST", async () => {
    const response = await fetch(server.url("/"), {
      method: "POST",
    });

    expect(response.status).toBe(StatusCode.OK);
    expect(await response.text()).toBe("all");
  });

  it("should hit DELETE", async () => {
    const response = await fetch(server.url("/"), {
      method: "DELETE",
    });

    expect(response.status).toBe(StatusCode.OK);
    expect(await response.text()).toBe("all");
  });

  it("should hit PATCH", async () => {
    const response = await fetch(server.url("/"), {
      method: "PATCH",
    });

    expect(response.status).toBe(StatusCode.OK);
    expect(await response.text()).toBe("all");
  });

  it("should hit PUT", async () => {
    const response = await fetch(server.url("/"), {
      method: "PUT",
    });

    expect(response.status).toBe(StatusCode.OK);
    expect(await response.text()).toBe("all");
  });

  it("should hit OPTIONS", async () => {
    const response = await fetch(server.url("/"), {
      method: "OPTIONS",
    });

    expect(response.status).toBe(StatusCode.OK);
    expect(await response.text()).toBe("all");
  });

  it("should hit HEAD", async () => {
    const response = await fetch(server.url("/"), {
      method: "HEAD",
    });

    expect(response.status).toBe(StatusCode.OK);
    expect(await response.text()).toBe("");
  });
});
