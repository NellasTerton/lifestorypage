import { chunkMessages, textMessages, type ChatMessage } from "./chat.ts";
import { mapLimit } from "./claude.ts";
import { dedupeFirsts, extractFromChunk, type Claim } from "./extract.ts";
import { frequentPhrases, topWords, totalStats, weekdayActivity } from "./stats.ts";
import { verifyClaim } from "./verify.ts";

export const CHUNK_SIZE = 120;

export type SectionInput = {
  type: string;
  content: string;
  sourceMessageIds: number[];
  sourceQuote: string | null;
  sourceDate: Date | null;
  status: string;
  verificationNote: string | null;
};

export type Progress = (message: string) => void;

/** Earliest cited message date, so a page can label a claim without the chat file. */
export function earliestDate(
  ids: number[],
  byId: Map<number, ChatMessage>,
): Date | null {
  const times = ids
    .map((id) => byId.get(id)?.date)
    .filter((d): d is string => Boolean(d))
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t));
  return times.length ? new Date(Math.min(...times)) : null;
}

export function indexById(messages: ChatMessage[]) {
  return new Map<number, ChatMessage>(messages.map((m) => [m.id, m]));
}

/**
 * Deterministic sections. Fast and free — computed straight from the corpus,
 * so the story page has something to show before the LLM stages finish.
 */
export function computedSections(messages: ChatMessage[]): SectionInput[] {
  const texts = textMessages(messages);
  const byId = indexById(messages);
  const rows: SectionInput[] = [];

  rows.push({
    type: "total_stats",
    content: JSON.stringify(totalStats(messages)),
    sourceMessageIds: [],
    sourceQuote: null,
    sourceDate: null,
    status: "computed",
    verificationNote: "Агрегация по всему корпусу, без LLM.",
  });

  rows.push({
    type: "top_words",
    content: JSON.stringify(topWords(texts, 20)),
    sourceMessageIds: [],
    sourceQuote: null,
    sourceDate: null,
    status: "computed",
    verificationNote: "Частотный анализ по всему корпусу, без LLM.",
  });

  rows.push({
    type: "weekday_activity",
    content: JSON.stringify(weekdayActivity(messages)),
    sourceMessageIds: [],
    sourceQuote: null,
    sourceDate: null,
    status: "computed",
    verificationNote: "Подсчёт по датам сообщений, без LLM.",
  });

  const phrases = frequentPhrases(texts);
  if (phrases[0]) {
    rows.push({
      type: "frequent_phrase",
      content: JSON.stringify(phrases),
      sourceMessageIds: phrases[0].exampleMessageIds,
      sourceQuote: phrases[0].phrase,
      sourceDate: earliestDate(phrases[0].exampleMessageIds, byId),
      status: "computed",
      verificationNote: "N-граммный анализ по всему корпусу, без LLM.",
    });
  }

  return rows;
}

/**
 * Extraction + verification. Every claim the model produces is checked by a
 * separate pass before it is stored, and lands as `verified` or `flagged`.
 */
export async function llmSections(
  messages: ChatMessage[],
  onProgress: Progress = () => {},
): Promise<SectionInput[]> {
  const texts = textMessages(messages);
  const byId = indexById(messages);
  const chunks = chunkMessages(texts, CHUNK_SIZE);

  onProgress(`Извлечение: ${chunks.length} кусков`);
  const extractions = await mapLimit(chunks, 3, async (chunk) => {
    const result = await extractFromChunk(chunk);
    onProgress(
      `  кусок #${chunk.index + 1}: ${result.key_moments.length} моментов, ` +
        `${result.firsts.length} "первых"`,
    );
    return result;
  });

  const claims: Array<{ type: string; claim: Claim }> = [
    ...extractions.flatMap((e) => e.key_moments).map((claim) => ({
      type: "key_moment",
      claim,
    })),
    ...dedupeFirsts(extractions.flatMap((e) => e.firsts)).map((claim) => ({
      type: "first_event",
      claim,
    })),
  ];

  onProgress(`Верификация: ${claims.length} утверждений`);
  let done = 0;
  const verified = await mapLimit(claims, 5, async ({ type, claim }) => {
    const v = await verifyClaim(claim, byId);
    done += 1;
    onProgress(`  [${done}/${claims.length}] ${v.status}: ${claim.claim.slice(0, 60)}`);
    return { type, ...v };
  });

  return verified.map((v) => ({
    type: v.type,
    content: v.claim.claim,
    sourceMessageIds: v.claim.source_message_ids,
    sourceQuote: v.claim.source_quote,
    sourceDate: earliestDate(v.claim.source_message_ids, byId),
    status: v.status,
    verificationNote: v.note,
  }));
}
