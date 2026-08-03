import { readFileSync } from "node:fs";

export type ChatMessage = {
  id: number;
  date: string;
  from: string;
  text: string;
  photo: boolean;
  voice: boolean;
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

/** Normalises an already-parsed Telegram export. Used by both CLI and upload. */
export function parseChat(raw: unknown): Chat {
  const data = (raw ?? {}) as { name?: unknown; messages?: unknown };
  const list = Array.isArray(data.messages) ? data.messages : [];

  const messages: ChatMessage[] = list
    .filter((m: { type?: string }) => m?.type === "message")
    .map((m: Record<string, unknown>) => ({
      id: Number(m.id),
      date: String(m.date),
      from: String(m.from ?? "unknown"),
      text: flattenText(m.text).trim(),
      photo: Boolean(m.photo),
      voice: m.media_type === "voice_message",
    }))
    .filter((m: ChatMessage) => Number.isInteger(m.id));

  return { name: String(data.name ?? "chat"), messages };
}

export function loadChat(path: string): Chat {
  return parseChat(JSON.parse(readFileSync(path, "utf8")));
}

/**
 * Messages that carry text. Media-only messages stay in the corpus for
 * counting but are useless to the LLM and to word statistics.
 */
export function textMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter((m) => m.text.length > 0);
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
