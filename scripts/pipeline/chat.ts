import { readFileSync } from "node:fs";

export type ChatMessage = {
  id: number;
  date: string;
  from: string;
  text: string;
};

export type Chat = {
  name: string;
  messages: ChatMessage[];
};

export type Chunk = {
  index: number;
  messages: ChatMessage[];
};

/**
 * Telegram exports store `text` either as a plain string or as an array of
 * plain strings and entity objects (links, mentions). Flatten both shapes.
 */
function flattenText(text: unknown): string {
  if (typeof text === "string") return text;
  if (!Array.isArray(text)) return "";
  return text
    .map((part) =>
      typeof part === "string" ? part : ((part as { text?: string })?.text ?? ""),
    )
    .join("");
}

export function loadChat(path: string): Chat {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const messages: ChatMessage[] = (raw.messages ?? [])
    .filter((m: { type?: string }) => m.type === "message")
    .map((m: Record<string, unknown>) => ({
      id: Number(m.id),
      date: String(m.date),
      from: String(m.from ?? "unknown"),
      text: flattenText(m.text).trim(),
    }))
    .filter((m: ChatMessage) => m.text.length > 0);

  return { name: String(raw.name ?? "chat"), messages };
}

export function chunkMessages(messages: ChatMessage[], size = 120): Chunk[] {
  const chunks: Chunk[] = [];
  for (let i = 0; i < messages.length; i += size) {
    chunks.push({ index: chunks.length, messages: messages.slice(i, i + size) });
  }
  return chunks;
}

/** Renders messages for an LLM prompt with ids the model must cite back. */
export function renderMessages(messages: ChatMessage[]): string {
  return messages
    .map((m) => `[id=${m.id}] ${m.date} ${m.from}: ${m.text}`)
    .join("\n");
}
