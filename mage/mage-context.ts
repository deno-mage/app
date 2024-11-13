import { renderToReadableStream } from "../imports/react-dom/server.ts";
import { StatusCode } from "./utils/status-codes.ts";

type JSONValues = string | number | boolean | null | JSONValues[];
type JSON = { [key: string]: JSONValues } | JSONValues[];

export class MageContext {
  public minifyJson: boolean = false;
  public headers: Headers = new Headers();
  public bodyInit: BodyInit | undefined;
  public status: StatusCode = StatusCode.OK;

  public constructor(public request: Request) {}

  public text(status: StatusCode, body: string) {
    this.headers.set("Content-Type", "text/plain");
    this.status = status;
    this.bodyInit = body;
  }

  public json(status: StatusCode, body: JSON) {
    this.headers.set("Content-Type", "application/json");
    this.status = status;
    this.bodyInit = this.toJSONString(body);
  }

  public async renderStatic(status: StatusCode, body: JSX.Element) {
    this.headers.set("Content-Type", "text/html");
    this.status = status;
    this.bodyInit = await renderToReadableStream(body);
  }

  private toJSONString(json: JSON) {
    return JSON.stringify(json, null, this.minifyJson ? 0 : 2);
  }
}
