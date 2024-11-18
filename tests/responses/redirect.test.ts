import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";
import { RedirectType } from "../../src/http.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/temp", (context) => {
    context.redirect(RedirectType.Temporary, "/temp-new");
  });

  server.app.get("/perm", (context) => {
    context.redirect(RedirectType.Permanent, "/perm-new");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("responses - redirect", () => {
  it("should return remp redirect response", async () => {
    const response = await fetch(server.url("/temp"), {
      method: "GET",
      redirect: "manual",
    });

    expect(response.status).toBe(StatusCode.TemporaryRedirect);
    expect(response.headers.get("location")).toBe("/temp-new");
    expect(await response.text()).toBe("");
  });

  it("should return perm redirect response", async () => {
    const response = await fetch(server.url("/perm"), {
      method: "GET",
      redirect: "manual",
    });

    expect(response.status).toBe(StatusCode.PermanentRedirect);
    expect(response.headers.get("location")).toBe("/perm-new");
    expect(await response.text()).toBe("");
  });
});
