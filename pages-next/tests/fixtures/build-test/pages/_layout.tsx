import type { LayoutProps } from "../../../../types.ts";
import { Head } from "../../../../head.tsx";
import { useFrontmatter } from "../../../../context.tsx";

export default function RootLayout({ children }: LayoutProps) {
  const { title, description } = useFrontmatter();

  return (
    <>
      <Head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        <link rel="stylesheet" href="/public/styles.css" />
      </Head>
      <main>{children}</main>
    </>
  );
}
