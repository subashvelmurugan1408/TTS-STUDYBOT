/**
 * Strips all Markdown, LaTeX math symbols, code snippets, table pipes,
 * headers, emojis, and special characters from text so it can be cleanly
 * and naturally spoken by the browser's speech synthesis engine.
 */
export function cleanTextForSpeech(rawText: string): string {
  if (!rawText) return "";

  let text = rawText;

  // 1. Remove code blocks ``` ... ```
  text = text.replace(/```[\s\S]*?```/g, "");

  // 2. Remove LaTeX math display blocks \\[ ... \\] and inline \\( ... \\)
  text = text.replace(/\\\[[\s\S]*?\\\]/g, "");
  text = text.replace(/\\\([\s\S]*?\\\)/g, "");
  text = text.replace(/\$\$[\s\S]*?\$\$/g, "");
  text = text.replace(/\$([^$\n]+)\$/g, "$1");

  // Remove LaTeX tags like \boxed{}, \text{}, \frac{}, \sqrt{}, etc.
  text = text.replace(/\\(?:boxed|text|frac|mathbf|mathrm|sqrt)\{([^}]+)\}/g, "$1");
  text = text.replace(/\\[a-zA-Z]+/g, " ");

  // 3. Remove Markdown tables (lines containing |)
  text = text.replace(/^\|.*\|$/gm, "");
  text = text.replace(/\|/g, " ");

  // 4. Remove Markdown headers (#, ##, ###, etc.)
  text = text.replace(/^#{1,6}\s+/gm, "");

  // 5. Remove horizontal rules (---, ***, ___)
  text = text.replace(/^[\s\-_*]{3,}$/gm, "");

  // 6. Convert Markdown links [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 7. Remove image tags ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");

  // 8. Remove inline code `code`
  text = text.replace(/`([^`]+)`/g, "$1");

  // 9. Remove bold, italic, and strikethrough markdown symbols
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
  text = text.replace(/(\*|_)(.*?)\1/g, "$2");
  text = text.replace(/~~(.*?)~~/g, "$1");

  // 10. Remove any remaining markdown markers
  text = text.replace(/[*_~#`>]/g, "");

  // 11. Remove blockquote markers and list bullets at start of lines
  text = text.replace(/^\s*[-*+]\s+/gm, "");
  text = text.replace(/^\s*\d+\.\s+/gm, "");

  // 12. Strip emojis that speech engines pronounce unnaturally
  text = text.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
    ""
  );

  // 13. Replace common HTML entities
  text = text.replace(/&amp;/g, " and ");
  text = text.replace(/&lt;/g, " less than ");
  text = text.replace(/&gt;/g, " greater than ");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");

  // 14. Clean dashes and slashes
  text = text.replace(/[-–—]/g, " ");
  text = text.replace(/\/{2,}/g, " ");

  // 15. Normalize extra whitespace and line breaks
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Extracts a concise (2-3 sentences) spoken explanation from cleaned text
 * if no pre-generated spokenExplanation is available.
 */
export function extractShortExplanation(
  rawText: string,
  spokenExplanation?: string
): string {
  if (spokenExplanation && spokenExplanation.trim()) {
    return cleanTextForSpeech(spokenExplanation);
  }

  const cleaned = cleanTextForSpeech(rawText);
  if (!cleaned) return "";

  // Split into sentences using punctuation (.!?)
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15 && !s.startsWith("http"));

  if (sentences.length <= 3) {
    return sentences.join(" ");
  }

  // Take the first 2-3 most substantial sentences, up to ~280 chars
  let result = "";
  for (const s of sentences) {
    if (result.length + s.length > 280) break;
    result += (result ? " " : "") + s;
    if (result.split(/(?<=[.!?])\s+/).length >= 3) break;
  }

  return result || sentences.slice(0, 2).join(" ");
}
