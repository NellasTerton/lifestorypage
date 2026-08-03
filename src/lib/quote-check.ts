import type { ChatMessage } from "@/lib/pipeline/chat";

/**
 * Case- and whitespace-insensitive form used on both sides of the comparison,
 * so a quote that differs only in spacing still matches. Typographic quotes
 * and dashes are folded too — models routinely swap « » for " " and – for -.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[«»""„"'']/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** The haystack stored on a story: every message text, normalised once. */
export function buildSourceText(messages: ChatMessage[]): string {
  return normalize(messages.map((m) => m.text).join("\n"));
}

/**
 * Mechanical proof that a quote was not invented: it either occurs in the
 * original chat or it does not. No model involved.
 */
export function quoteMatches(
  quote: string | null,
  sourceText: string | null,
): boolean | null {
  if (!sourceText) return null; // source not kept for this story
  if (!quote) return null; // nothing to check (computed sections)
  return sourceText.includes(normalize(quote));
}
