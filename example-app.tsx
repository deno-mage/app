import { MageApp, StatusCode } from "./mod.ts";
import { useServeFiles } from "./src/middleware/serve-files.ts";

const app = new MageApp();

app.get("/text", (context) => {
  context.text(StatusCode.OK, "Hello, World!");
});

app.get("/json", (context) => {
  context.json(StatusCode.OK, { message: "Hello, World!" });
});

app.get("/render", async (context) => {
  await context.render(
    StatusCode.OK,
    <html lang="en">
      <body>
        <h1>Hello, World!</h1>
        <img src={context.asset("/public/image.png")} />
      </body>
    </html>,
  );
});

app.get("/rewrite", async (context) => {
  await context.rewrite("/target");
});

app.get("/target", (context) => {
  context.json(StatusCode.OK, {
    message: context.request.searchParam("message"),
  });
});

app.get("/public/*", useServeFiles({ directory: "./public" }));

app.get("/websocket", (context) => {
  context.webSocket((socket) => {
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

app.get("/websocket-client", async (context) => {
  await context.render(
    StatusCode.OK,
    <html lang="en">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            const socket = new WebSocket("ws://localhost:8000/websocket");

            socket.onopen = () => {
              console.log("WebSocket connection established");
              socket.send("ping");
            };

            socket.onmessage = (event) => {
              console.log(event.data);
            };

            socket.onclose = () => {
              console.log("WebSocket connection closed");
            };
          `,
          }}
        />
      </body>
    </html>,
  );
});

Deno.serve(app.build());
