import { Container } from "./container.tsx";

export const Footer = () => {
  return (
    <footer>
      <Container>
        <div className="container flex justify-between align-top">
          <p>Mage - Simple, Fast Web Framework for Deno</p>
        </div>
      </Container>
    </footer>
  );
};
