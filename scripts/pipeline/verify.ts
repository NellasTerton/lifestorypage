import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod";
import type { ChatMessage } from "./chat.ts";
import { claude, MODEL } from "./claude.ts";
import type { Claim } from "./extract.ts";

const VerdictSchema = z.object({
  supported: z
    .boolean()
    .describe("true — утверждение подтверждается указанными сообщениями."),
  quote_is_verbatim: z
    .boolean()
    .describe("true — цитата дословно встречается в указанных сообщениях."),
  reason: z.string().describe("Одно предложение с обоснованием."),
});

export type Verification = {
  claim: Claim;
  status: "verified" | "flagged";
  note: string;
};

const SYSTEM = `Ты проверяешь факты. Тебе дают утверждение, список id сообщений и цитату, а также полный текст этих сообщений.

Ответь на два вопроса строго по тексту:
1. supported — следует ли утверждение именно из этих сообщений? Не из общих знаний, не из правдоподобности, а из текста.
2. quote_is_verbatim — встречается ли цитата дословно в тексте этих сообщений?

Будь строгим. Если утверждение шире того, что сказано в сообщениях, или цитата перефразирована — это не подтверждение.`;

export async function verifyClaim(
  claim: Claim,
  byId: Map<number, ChatMessage>,
): Promise<Verification> {
  // Cheap deterministic pre-check: a claim citing ids that aren't in the
  // corpus is a hallucination, no API call needed.
  const missing = claim.source_message_ids.filter((id) => !byId.has(id));
  if (claim.source_message_ids.length === 0) {
    return { claim, status: "flagged", note: "Не указаны source_message_ids." };
  }
  if (missing.length > 0) {
    return {
      claim,
      status: "flagged",
      note: `Ссылки на несуществующие сообщения: ${missing.join(", ")}.`,
    };
  }

  const sources = claim.source_message_ids
    .map((id) => byId.get(id)!)
    .map((m) => `[id=${m.id}] ${m.date} ${m.from}: ${m.text}`)
    .join("\n");

  const response = await claude.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM,
    output_config: {
      effort: "low",
      format: zodOutputFormat(VerdictSchema),
    },
    messages: [
      {
        role: "user",
        content: `Утверждение: ${claim.claim}

Цитата: «${claim.source_quote}»

Тексты указанных сообщений:
${sources}`,
      },
    ],
  });

  const verdict = response.parsed_output;
  if (!verdict) {
    return { claim, status: "flagged", note: "Проверка не вернула результат." };
  }

  const ok = verdict.supported && verdict.quote_is_verbatim;
  return {
    claim,
    status: ok ? "verified" : "flagged",
    note: ok
      ? verdict.reason
      : `${verdict.supported ? "" : "Утверждение не следует из сообщений. "}${
          verdict.quote_is_verbatim ? "" : "Цитата не дословная. "
        }${verdict.reason}`.trim(),
  };
}
