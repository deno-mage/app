import { renderToReadableStream } from "../npm/react-dom/server.ts";
import { statusTextMap, StatusCode } from "./http.ts";

type JSONValues = string | number | boolean | null | JSONValues[];
type JSON = { [key: string]: JSONValues } | JSONValues[];

export class MageContext {
  public isRouteMatched = false;
  public response = new Response();

  private promises: Promise<unknown>[] = [];

  public constructor(public request: Request, public url: URL) {}

  public text(status: StatusCode, body: string) {
    this.response = new Response(body, {
      status: status,
      statusText: statusTextMap[status],
      headers: this.response.headers,
    });
    this.response.headers.set("Content-Type", "text/plain; charset=utf-8");
  }

  public json(status: StatusCode, body: JSON) {
    this.response = new Response(JSON.stringify(body), {
      status: status,
      statusText: statusTextMap[status],
      headers: this.response.headers,
    });
    this.response.headers.set("Content-Type", "application/json");
  }

  public async html(status: StatusCode, body: JSX.Element) {
    await this.capturePromise(async () => {
      this.response = new Response(await renderToReadableStream(body), {
        status: status,
        statusText: statusTextMap[status],
        headers: this.response.headers,
      });
      this.response.headers.set("Content-Type", "text/html; charset=utf-8");
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
}
