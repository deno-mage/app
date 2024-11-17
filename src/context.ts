import { renderToReadableStream } from "../npm/react-dom/server.ts";
import { statusTextMap, StatusCode, RedirectType, StatusText } from "./http.ts";
import { MageRouter } from "./router.ts";

type JSONValues = string | number | boolean | null | JSONValues[];
type JSON = { [key: string]: JSONValues } | JSONValues[];

export class MageContext {
  public url: URL;
  public matchedPathname: string | undefined;
  public response = new Response();

  public constructor(public request: Request, private router: MageRouter) {
    this.url = new URL(request.url);
  }

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

  public async render(status: StatusCode, body: JSX.Element) {
    this.response = new Response(await renderToReadableStream(body), {
      status: status,
      statusText: statusTextMap[status],
      headers: this.response.headers,
    });

    this.response.headers.set("Content-Type", "text/html; charset=utf-8");
  }

  public empty() {
    this.response = new Response(null, {
      status: StatusCode.NoContent,
      statusText: StatusText.NoContent,
      headers: this.response.headers,
    });

    this.response.headers.set("Content-Length", "0");
  }

  public redirect(redirectType: RedirectType, location: URL | string) {
    const status =
      redirectType === RedirectType.Permanent
        ? StatusCode.PermanentRedirect
        : StatusCode.TemporaryRedirect;

    this.response = new Response(null, {
      status,
      statusText: statusTextMap[status],
      headers: this.response.headers,
    });

    this.response.headers.set("Location", location.toString());
  }

  public getAvailableMethods(pathname: string): string[] {
    return this.router.getAvailableMethods(pathname);
  }
}
