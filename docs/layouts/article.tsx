export default function DefaultLayout({
  html,
  title,
  description,
}: {
  html: string;
  title: string;
  description?: string;
}) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        <link rel="stylesheet" href="/public/styles.css" />
      </head>
      <body>
        <header>
          <div class="container">
            <nav>
              <a href="/">Home</a>
              {" | "}
              <a href="/installation">Installation</a>
              {" | "}
              <a href="/getting-started">Getting Started</a>
            </nav>
          </div>
        </header>
        <main
          className="container"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <footer>
          <div class="container">
            <p>Mage - Simple, Fast Web Framework for Deno</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
