/** Preserve authored paragraphs; give long, unformatted answers readable groups
 * without rewriting the provider's facts or treating its output as HTML. */
export function replyParagraphs(text: string): string[] {
  const plain = text.replace(/\r\n?/g, "\n").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/^#{1,6}\s+/gm, "");
  const blocks = plain.trim().split(/\n\s*\n|\n(?=\s*[-*]\s+)/).map(p => p.replace(/^\s*[-*]\s+/, "").trim()).filter(Boolean);
  if (blocks.length !== 1 || blocks[0].length <= 260 || typeof Intl.Segmenter !== "function") return blocks;
  const sentences = Array.from(new Intl.Segmenter(undefined, { granularity: "sentence" }).segment(blocks[0]), s => s.segment.trim());
  const paragraphs: string[] = [];
  let group: string[] = [];
  for (const sentence of sentences) {
    if (group.length && (group.length === 2 || [...group, sentence].join(" ").length > 360)) {
      paragraphs.push(group.join(" ")); group = [];
    }
    group.push(sentence);
  }
  if (group.length) paragraphs.push(group.join(" "));
  return paragraphs;
}
