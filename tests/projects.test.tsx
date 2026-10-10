import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Projects from "../src/components/projects/Projects";
import Case from "../src/components/projects/Case";
import { ShellProvider } from "../src/components/shell/context";
import { projects } from "../src/data/content";
describe("published project collections", () => {
  it("renders an accessible empty state for zero published projects", () => {
    const html = renderToStaticMarkup(
      <ShellProvider>
        <Projects projects={[]} />
      </ShellProvider>,
    );
    expect(html).toContain("Nenhum projeto publicado");
  });
  it("uses project identity when the publishing order changes", () => {
    const html = renderToStaticMarkup(
      <ShellProvider>
        <Projects projects={[projects[1], projects[0], projects[2]]} />
      </ShellProvider>,
    );
    // All cases remain in the semantic document; identity is checked within
    // the first frame rather than assuming inactive cases are unmounted.
    const firstFrame = html
      .split('data-frame-index="0"')[1]
      .split('data-frame-index="1"')[0];
    expect(firstFrame).toContain("/projetos/ohm-engenharia.jpg");
    expect(firstFrame).toContain("https://ohm-engenharia.netlify.app/");
    expect(firstFrame).not.toContain("/projetos/jorak-editor.jpg");
    expect(firstFrame).not.toContain("Nova tarefa");
  });
  it("shows supplied media for a new case without a matching demonstration", () => {
    const html = renderToStaticMarkup(
      <ShellProvider>
        <Case
          project={{ ...projects[0], slug: "estudo-novo", preview: undefined }}
        />
      </ShellProvider>,
    );
    expect(html).not.toContain("Nova tarefa");
    expect(html).toContain("/projetos/jorak-editor.jpg");
  });
});
