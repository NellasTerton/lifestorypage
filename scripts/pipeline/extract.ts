import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod";
import { renderMessages, type Chunk } from "./chat.ts";
import { claude, MODEL } from "./claude.ts";

const ClaimSchema = z.object({
  claim: z
    .string()
    .describe("Утверждение на русском языке, одно предложение."),
  source_message_ids: z
    .array(z.number())
    .describe("id сообщений из фрагмента, подтверждающих утверждение."),
  source_quote: z
    .string()
    .describe(
      "Точная дословная цитата из одного из этих сообщений, без изменений.",
    ),
});

const ExtractionSchema = z.object({
  key_moments: z
    .array(ClaimSchema)
    .describe("5-7 самых значимых моментов этого фрагмента."),
  firsts: z
    .array(ClaimSchema)
    .describe(
      "Первые случаи заметных событий в этом фрагменте: кто первым что-то сказал или сделал впервые.",
    ),
});

export type Claim = z.infer<typeof ClaimSchema>;
export type Extraction = z.infer<typeof ExtractionSchema>;

const SYSTEM = `Ты анализируешь переписку двух людей, чтобы собрать хронику их отношений.

Правила, которые нельзя нарушать:
- Опирайся только на текст сообщений. Не додумывай и не обобщай сверх написанного.
- source_message_ids — только id, которые реально есть в переданном фрагменте.
- source_quote — дословный фрагмент текста одного из этих сообщений, скопированный посимвольно. Не перефразируй, не переводи, не исправляй опечатки.
- Если подходящих моментов меньше, чем просят, верни меньше. Пустой массив лучше выдуманного утверждения.

Категория key_moments: поворотные точки — договорённости, признания, ссоры, планы, решения, важные новости.
Категория firsts: первое появление чего-то заметного (первая встреча, первое признание, первое совместное решение, первое упоминание темы). Только если это действительно первое появление в рамках фрагмента.`;

export async function extractFromChunk(chunk: Chunk): Promise<Extraction> {
  const first = chunk.messages[0];
  const last = chunk.messages[chunk.messages.length - 1];

  const response = await claude.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    output_config: {
      effort: "medium",
      format: zodOutputFormat(ExtractionSchema),
    },
    messages: [
      {
        role: "user",
        content: `Фрагмент ${chunk.index + 1} переписки (${chunk.messages.length} сообщений, ${first.date} — ${last.date}).

${renderMessages(chunk.messages)}

Извлеки key_moments и firsts из этого фрагмента.`,
      },
    ],
  });

  return response.parsed_output ?? { key_moments: [], firsts: [] };
}

/**
 * "Первое X" имеет смысл только глобально: один и тот же сюжет всплывает в
 * нескольких фрагментах, поэтому оставляем самое раннее упоминание каждой темы.
 */
export function dedupeFirsts(claims: Claim[]): Claim[] {
  const byTopic = new Map<string, Claim>();

  for (const claim of claims) {
    const topic = claim.claim
      .toLowerCase()
      .replace(/[^a-zа-яё0-9 ]/gi, "")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 4)
      .join(" ");

    const earliest = Math.min(...claim.source_message_ids);
    const existing = byTopic.get(topic);
    if (!existing || earliest < Math.min(...existing.source_message_ids)) {
      byTopic.set(topic, claim);
    }
  }

  return [...byTopic.values()].sort(
    (a, b) => Math.min(...a.source_message_ids) - Math.min(...b.source_message_ids),
  );
}
