import { renderToReadableStream } from "../imports/react-dom/server.ts";
import { getStatusText, StatusCode } from "./status-codes.ts";

type JSONValues = string | number | boolean | null | JSONValues[];
type JSON = { [key: string]: JSONValues } | JSONValues[];

export class MageContext {
  public minifyJson: boolean = false;
  public headers: Headers = new Headers();
  public response: Response | undefined;

  private promises: Promise<unknown>[] = [];

  public constructor(public request: Request) {}

  public text(status: StatusCode, body: string) {
    this.headers.set("Content-Type", "text/plain");
    this.response = new Response(body, {
      status: status,
      statusText: getStatusText(status),
      headers: this.headers,
    });
  }

  public json(status: StatusCode, body: JSON) {
    this.headers.set("Content-Type", "application/json");
    this.response = new Response(this.toJSONString(body), {
      status: status,
      statusText: getStatusText(status),
      headers: this.headers,
    });
  }

  public async renderStatic(status: StatusCode, body: JSX.Element) {
    await this.capturePromise(async () => {
      this.headers.set("Content-Type", "text/html");
      this.response = new Response(await renderToReadableStream(body), {
        status: status,
        statusText: getStatusText(status),
        headers: this.headers,
      });
    });
  }

  // flush any promises created within context during handler execution
  public async flush() {
    await Promise.all(this.promises);
    this.promises = [];
  }

  // capture promises created within context so we can flush them
  // before moving between handlers
  private async capturePromise(fn: () => Promise<void>) {
    const promise = new Promise<void>((resolve) => {
      fn().then(() => resolve());
    });

    this.promises.push(promise);

    await promise;
  }

  private toJSONString(json: JSON) {
    return JSON.stringify(json, null, this.minifyJson ? 0 : 2);
  }
}
