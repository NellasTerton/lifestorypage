import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod";
import type { ChatMessage } from "./chat.ts";
import { getClaude, MODEL } from "./claude.ts";
import type { Claim } from "./extract.ts";

export const VERIFY_BATCH_SIZE = 10;

const BatchVerdictSchema = z.object({
  verdicts: z
    .array(
      z.object({
        index: z.number().describe("Номер утверждения, как он дан во входных данных."),
        supported: z
          .boolean()
          .describe("true — утверждение подтверждается указанными сообщениями."),
        quote_is_verbatim: z
          .boolean()
          .describe("true — цитата дословно встречается в указанных сообщениях."),
        reason: z.string().describe("Одно предложение с обоснованием."),
      }),
    )
    .describe("Ровно по одному вердикту на каждое входное утверждение."),
});

export type Verification = {
  claim: Claim;
  status: "verified" | "flagged";
  note: string;
};

const SYSTEM = `Ты проверяешь факты. Тебе дают несколько пронумерованных утверждений. Для каждого — цитата и полный текст сообщений, на которые оно ссылается.

По каждому утверждению ответь строго по тексту:
1. supported — следует ли утверждение именно из его сообщений? Не из общих знаний, не из правдоподобности, а из текста.
2. quote_is_verbatim — встречается ли цитата дословно в тексте его сообщений?

Будь строгим. Если утверждение шире того, что сказано в сообщениях, или цитата перефразирована — это не подтверждение.

Проверяй каждое утверждение независимо: сообщения одного утверждения не являются источником для другого. Верни ровно по одному вердикту на каждое утверждение, с тем же index.`;

function toVerification(
  claim: Claim,
  verdict: { supported: boolean; quote_is_verbatim: boolean; reason: string },
): Verification {
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

/**
 * Deterministic screen that needs no API call: a claim citing message ids that
 * aren't in the corpus is a hallucination on its face.
 */
function preCheck(claim: Claim, byId: Map<number, ChatMessage>): Verification | null {
  if (claim.source_message_ids.length === 0) {
    return { claim, status: "flagged", note: "Не указаны source_message_ids." };
  }
  const missing = claim.source_message_ids.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    return {
      claim,
      status: "flagged",
      note: `Ссылки на несуществующие сообщения: ${missing.join(", ")}.`,
    };
  }
  return null;
}

function renderSources(claim: Claim, byId: Map<number, ChatMessage>): string {
  return claim.source_message_ids
    .map((id) => byId.get(id)!)
    .map((m) => `[id=${m.id}] ${m.date} ${m.from}: ${m.text}`)
    .join("\n");
}

/**
 * Verifies a batch of claims in one request. Each claim still gets its own
 * independent judgement — batching only amortises the round trip, which is what
 * keeps a 600-message chat inside a serverless function's time limit.
 */
export async function verifyBatch(
  claims: Claim[],
  byId: Map<number, ChatMessage>,
): Promise<Verification[]> {
  const results = new Array<Verification | null>(claims.length).fill(null);
  const pending: Array<{ index: number; claim: Claim }> = [];

  claims.forEach((claim, i) => {
    const early = preCheck(claim, byId);
    if (early) results[i] = early;
    else pending.push({ index: i, claim });
  });

  if (pending.length > 0) {
    const body = pending
      .map(
        ({ index, claim }) => `### Утверждение ${index}
Текст: ${claim.claim}
Цитата: «${claim.source_quote}»
Сообщения:
${renderSources(claim, byId)}`,
      )
      .join("\n\n");

    const response = await getClaude().messages.parse({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      output_config: {
        // Judging 10 claims in one request is more work than judging one, and
        // at `low` the pass got visibly more lenient — which defeats its
        // entire purpose, so the batched version buys back the rigour.
        effort: "medium",
        format: zodOutputFormat(BatchVerdictSchema),
      },
      messages: [
        {
          role: "user",
          content: `Проверь ${pending.length} утверждений.\n\n${body}`,
        },
      ],
    });

    const byIndex = new Map(
      (response.parsed_output?.verdicts ?? []).map((v) => [v.index, v]),
    );

    for (const { index, claim } of pending) {
      const verdict = byIndex.get(index);
      // A claim the model skipped is never silently promoted to verified.
      results[index] = verdict
        ? toVerification(claim, verdict)
        : { claim, status: "flagged", note: "Проверка не вернула вердикт." };
    }
  }

  return results as Verification[];
}
