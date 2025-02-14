import { MageApp } from "./app/mod.ts";
import { useServeFiles } from "./serve-files/mod.ts";

const app = new MageApp();

app.get("/text", (c) => {
  c.text("Hello, World!");
});

app.get("/json", (c) => {
  c.json({ message: "Hello, World!" });
});

app.get("/rewrite", async (c) => {
  await c.rewrite("/target");
});

app.get("/target", (c) => {
  c.json({
    message: c.req.searchParam("message"),
  });
});

app.get("/public/*", useServeFiles({ directory: "./public" }));

app.get("/websocket", (c) => {
  c.webSocket((socket) => {
    socket.onmessage = (event) => {
      if (event.data === "ping") {
        socket.send("pong");
      }
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };
  });
});

Deno.serve(app.handler);
