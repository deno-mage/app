import { Container } from "./container.tsx";

interface LinkProps {
  href: string;
  children: string;
}

const Link = (props: LinkProps) => {
  return (
    <a href={props.href} className="text-blue-600 hover:underline">
      {props.children}
    </a>
  );
};

export const Header = () => {
  return (
    <header>
      <Container>
        <nav className="flex justify-between items-center">
          <ul>
            <li>
              <Link href="/">🧙‍♂️ Mage</Link>
            </li>
          </ul>
          <ul className="flex gap-4">
            <li>
              <Link href="/installation">Installation</Link>
            </li>
            <li>
              <Link href="https://github.com/deno-mage/app">GitHub</Link>
            </li>
            <li>
              <Link href="https://jsr.io/@mage/app">JSR</Link>
            </li>
          </ul>
        </nav>
      </Container>
    </header>
  );
};
