import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/websocket", (c) => {
    c.webSocket((socket) => {
      socket.onmessage = (event) => {
        if (event.data === "ping") {
          socket.send("pong");
        }
      };
    });
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("websockets", () => {
  it("should send back 501 not implented if not a websocket request", async () => {
    const response = await fetch(server.url("/websocket"), {
      method: "GET",
    });

    expect(response.status).toBe(501);
    expect(await response.text()).toBe("Not Implemented");
  });

  it("should send back pong if the message is ping", async () => {
    const ws = new WebSocket(server.wsUrl("/websocket"));

    const message = new Promise<string>((resolve) => {
      ws.onmessage = (event) => {
        resolve(event.data);
      };
    });

    ws.onopen = () => {
      ws.send("ping");
    };

    expect(await message).toBe("pong");

    ws.close();
  });
});
