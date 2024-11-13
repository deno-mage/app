import { MageApp } from "./mage/mage-app.ts";
import {
  handleErrors,
  handleUnhandled,
  minifyJson,
  setSecureHeaders,
} from "./mage/middleware.ts";
import { StatusCode } from "./mage/utils/status-codes.ts";

const app = new MageApp();

app.use(handleErrors());
app.use(setSecureHeaders());
app.use(handleUnhandled());
app.use(minifyJson());

app.get("/text", (context) => {
  context.text(StatusCode.OK, "Hello, World!");
});

app.get("/json", (context) => {
  context.json(StatusCode.OK, { message: "Hello, World!" });
});

app.get("/render-static", (context) => {
  context.renderStatic(
    StatusCode.OK,
    <html lang="en">
      <body>
        <h1>Hello, World!</h1>
      </body>
    </html>
  );
});

app.run({
  port: 8000,
});
