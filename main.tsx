import { MageApp } from "./mage/mage-app.ts";
import {
  handleErrors,
  handleUnhandled,
  minifyJson,
  setSecureHeaders,
} from "./mage/middlewares.ts";
import { StatusCode } from "./mage/utils/status-codes.ts";

const app = new MageApp();

app.use(handleErrors());
app.use(handleUnhandled());
app.use(minifyJson());

app.get("/", (context) => {
  context.text(StatusCode.OK, "Hello, World!");
});

app.get("/json", (context) => {
  context.json(StatusCode.OK, { message: "Hello, World!" });
});

app.get("/render-static", async (context) => {
  await context.renderStatic(
    StatusCode.OK,
    <html lang="en">
      <body>
        <h1>Hello, world from JSX!</h1>
      </body>
    </html>
  );
});

app.use(setSecureHeaders());

app.run({
  port: 8000,
});
