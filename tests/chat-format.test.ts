import { describe, expect, it } from "vitest";
import { replyParagraphs } from "@/lib/chat-format";

describe("assistant reading layout", () => {
  it("preserves explicit paragraphs and accents with Windows newlines", () => {
    expect(replyParagraphs("  Formação na FACENS.\r\n\r\nProjetos de engenharia e edição.  ")).toEqual(["Formação na FACENS.", "Projetos de engenharia e edição."]);
  });
  it("keeps short replies as one paragraph", () => {
    expect(replyParagraphs("Olá! Posso apresentar os projetos de Lucas.")).toEqual(["Olá! Posso apresentar os projetos de Lucas."]);
  });
  it("presents provider formatting as clean paragraphs without losing links", () => {
    expect(replyParagraphs("Projetos:\n- **Jorak Editor**: https://jorakeditor.netlify.app/\n- **OHM Engenharia**: site publicado.")).toEqual(["Projetos:", "Jorak Editor: https://jorakeditor.netlify.app/", "OHM Engenharia: site publicado."]);
  });
  it("breaks a dense answer into readable groups without dropping its content", () => {
    const text = "Lucas cursa Análise e Desenvolvimento de Sistemas na FACENS, com conclusão prevista para 2028. Ele também desenvolve interfaces e aplicações como freelancer. Entre os projetos estão Jorak Editor e OHM Engenharia, publicados e disponíveis no portfólio. Você pode conferir os trabalhos e conversar com Lucas pelo contato público informado no site.";
    const paragraphs = replyParagraphs(text);
    expect(paragraphs.length).toBeGreaterThan(1);
    expect(paragraphs.join(" ")).toBe(text);
  });
});
