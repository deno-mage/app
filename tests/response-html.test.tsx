import { afterAll, beforeAll, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../exports.ts";
import { MageTestServer } from "./utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/", async (context) => {
    await context.render(
      StatusCode.OK,
      <html lang="en">
        <body>
          <h1>Hello, World!</h1>
        </body>
      </html>
    );
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

it("should render jsx to html response", async () => {
  const response = await fetch(server.url("/"), {
    method: "GET",
  });

  expect(response.status).toBe(StatusCode.OK);
  expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
  expect(await response.text()).toBe(
    '<!DOCTYPE html><html lang="en"><body><h1>Hello, World!</h1></body></html>'
  );
});
