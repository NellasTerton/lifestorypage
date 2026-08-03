import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sections, stories } from "../../src/db/schema.ts";
import { chunkMessages, loadChat, type ChatMessage } from "./chat.ts";
import { mapLimit } from "./claude.ts";
import { dedupeFirsts, extractFromChunk, type Claim } from "./extract.ts";
import { frequentPhrases, topWords, totalStats, weekdayActivity } from "./stats.ts";
import { verifyClaim, type Verification } from "./verify.ts";

const CHAT_PATH = process.argv[2] ?? "synthetic-chat.json";
const CHUNK_SIZE = 120;

type SectionRow = {
  type: string;
  content: string;
  sourceMessageIds: number[];
  sourceQuote: string | null;
  status: string;
  verificationNote: string | null;
};

function stage(n: number, title: string) {
  console.log(`\n${"═".repeat(64)}\n${n}. ${title}\n${"═".repeat(64)}`);
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY не задан — LLM-этапы работать не будут.");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL не задан.");
    process.exit(1);
  }

  // ── 1. Загрузка ────────────────────────────────────────────────────────
  stage(1, "Загрузка");
  const chat = loadChat(CHAT_PATH);
  const byId = new Map<number, ChatMessage>(chat.messages.map((m) => [m.id, m]));
  const participants = [...new Set(chat.messages.map((m) => m.from))];
  console.log(`Чат:          ${chat.name}`);
  console.log(`Сообщений:    ${chat.messages.length}`);
  console.log(`Участники:    ${participants.join(", ")}`);
  console.log(
    `Период:       ${chat.messages[0].date} → ${chat.messages.at(-1)!.date}`,
  );

  // ── 2. Chunking ────────────────────────────────────────────────────────
  stage(2, "Chunking");
  const chunks = chunkMessages(chat.messages, CHUNK_SIZE);
  console.log(`Кусков: ${chunks.length} (по ~${CHUNK_SIZE} сообщений)`);
  for (const c of chunks) {
    console.log(
      `  #${c.index + 1}: ${c.messages.length} сообщений, ` +
        `id ${c.messages[0].id}–${c.messages.at(-1)!.id}, ` +
        `${c.messages[0].date.slice(0, 10)} → ${c.messages.at(-1)!.date.slice(0, 10)}`,
    );
  }

  const rows: SectionRow[] = [];

  // ── 3. Детерминированный анализ (без LLM) ──────────────────────────────
  stage(3, "Анализ без LLM (код)");

  const total = totalStats(chat.messages);
  console.log(
    `Всего сообщений: ${total.messageCount}, дней между первым и последним: ${total.daySpan}`,
  );
  console.log(`  ${total.firstDate} → ${total.lastDate}`);
  rows.push({
    type: "total_stats",
    content: JSON.stringify(total),
    sourceMessageIds: [],
    sourceQuote: null,
    status: "computed",
    verificationNote: "Агрегация по всему корпусу, без LLM.",
  });

  const words = topWords(chat.messages, 20);
  console.log("Топ-слова:");
  console.log(
    "  " + words.map((w) => `${w.word} (${w.count})`).join(", "),
  );
  rows.push({
    type: "top_words",
    content: JSON.stringify(words),
    sourceMessageIds: [],
    sourceQuote: null,
    status: "computed",
    verificationNote: "Частотный анализ по всему корпусу, без LLM.",
  });

  const weekdays = weekdayActivity(chat.messages);
  console.log("\nАктивность по дням недели:");
  const maxDay = Math.max(...weekdays.map((d) => d.count));
  for (const d of weekdays) {
    const bar = "█".repeat(Math.round((d.count / maxDay) * 32));
    console.log(`  ${d.weekday.padEnd(12)} ${String(d.count).padStart(3)} ${bar}`);
  }
  rows.push({
    type: "weekday_activity",
    content: JSON.stringify(weekdays),
    sourceMessageIds: [],
    sourceQuote: null,
    status: "computed",
    verificationNote: "Подсчёт по датам сообщений, без LLM.",
  });

  const phrases = frequentPhrases(chat.messages);
  console.log("\nСамые частые фразы:");
  for (const p of phrases) {
    console.log(`  «${p.phrase}» — ${p.count} раз`);
  }
  if (phrases[0]) {
    rows.push({
      type: "frequent_phrase",
      content: JSON.stringify(phrases),
      sourceMessageIds: phrases[0].exampleMessageIds,
      sourceQuote: phrases[0].phrase,
      status: "computed",
      verificationNote: "N-граммный анализ по всему корпусу, без LLM.",
    });
  }

  // ── 4. LLM-извлечение ──────────────────────────────────────────────────
  stage(4, "Извлечение через Claude API");
  console.log(`Отправляю ${chunks.length} кусков (параллельно по 3)...\n`);

  const extractions = await mapLimit(chunks, 3, async (chunk) => {
    const result = await extractFromChunk(chunk);
    console.log(
      `  ✓ кусок #${chunk.index + 1}: ` +
        `${result.key_moments.length} ключевых моментов, ${result.firsts.length} "первых"`,
    );
    return result;
  });

  const keyMoments = extractions.flatMap((e) => e.key_moments);
  const firsts = dedupeFirsts(extractions.flatMap((e) => e.firsts));
  console.log(
    `\nИтого: ${keyMoments.length} ключевых моментов, ` +
      `${firsts.length} "первых" (после дедупликации по темам).`,
  );

  console.log("\nПримеры ключевых моментов:");
  for (const c of keyMoments.slice(0, 3)) {
    console.log(`  • ${c.claim}`);
    console.log(`    ids=[${c.source_message_ids}] «${c.source_quote}»`);
  }
  console.log('\nПримеры "первых":');
  for (const c of firsts.slice(0, 3)) {
    console.log(`  • ${c.claim}`);
    console.log(`    ids=[${c.source_message_ids}] «${c.source_quote}»`);
  }

  // ── 5. Верификация ─────────────────────────────────────────────────────
  stage(5, "Верификация утверждений");
  const allClaims: Array<{ type: string; claim: Claim }> = [
    ...keyMoments.map((claim) => ({ type: "key_moment", claim })),
    ...firsts.map((claim) => ({ type: "first_event", claim })),
  ];
  console.log(`Проверяю ${allClaims.length} утверждений (параллельно по 5)...\n`);

  let done = 0;
  const verifications = await mapLimit(allClaims, 5, async ({ type, claim }) => {
    const v = await verifyClaim(claim, byId);
    done += 1;
    console.log(
      `  [${String(done).padStart(2)}/${allClaims.length}] ` +
        `${v.status === "verified" ? "✓ verified" : "⚠ flagged "} ` +
        `${claim.claim.slice(0, 60)}${claim.claim.length > 60 ? "…" : ""}`,
    );
    if (v.status === "flagged") console.log(`         → ${v.note}`);
    return { type, ...v } as Verification & { type: string };
  });

  const verified = verifications.filter((v) => v.status === "verified").length;
  const flagged = verifications.length - verified;
  console.log(`\nverified: ${verified}   flagged: ${flagged}`);

  for (const v of verifications) {
    rows.push({
      type: v.type,
      content: v.claim.claim,
      sourceMessageIds: v.claim.source_message_ids,
      sourceQuote: v.claim.source_quote,
      status: v.status,
      verificationNote: v.note,
    });
  }

  // ── 6. Запись в Neon ───────────────────────────────────────────────────
  stage(6, "Запись в Neon");
  const db = drizzle(neon(process.env.DATABASE_URL));

  const [story] = await db
    .insert(stories)
    .values({
      title: `Переписка: ${chat.name}`,
      sourceName: CHAT_PATH,
      messageCount: chat.messages.length,
    })
    .returning();
  console.log(`story_id = ${story.id}`);

  const inserted = await db
    .insert(sections)
    .values(rows.map((r) => ({ ...r, storyId: story.id })))
    .returning({ id: sections.id, type: sections.type });

  const byType = new Map<string, number>();
  for (const r of inserted) byType.set(r.type, (byType.get(r.type) ?? 0) + 1);
  console.log(`Записано секций: ${inserted.length}`);
  for (const [type, count] of byType) console.log(`  ${type}: ${count}`);

  console.log("\nГотово.");
}

main().catch((err) => {
  console.error("\nОшибка pipeline:", err);
  process.exit(1);
});
