export const frontmatter = {
  title: "Throwing Page",
  description: "This page throws an error",
};

export default function ThrowingPage() {
  throw new Error("Intentional error for testing");
}
