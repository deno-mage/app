type JSONValues = string | number | boolean | null | JSONValues[];
type JSON = { [key: string]: JSONValues } | JSONValues[];

export class MageContext {
  public headers: Headers = new Headers();
  public minifyJson: boolean = false;
  public response: Response | undefined = undefined;

  constructor(public request: Request) {}

  text(body: string) {
    this.headers.set("Content-Type", "text/plain");

    this.response = new Response(body, { headers: this.headers });
  }

  json(body: JSON) {
    this.headers.set("Content-Type", "application/json");
    const json = JSON.stringify(body, null, this.minifyJson ? 0 : 2);

    this.response = new Response(json, {
      headers: this.headers,
    });
  }

  error(status: number, message: string) {
    this.response = new Response(message, { status });
  }
}
