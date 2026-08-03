import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sections, stories } from "../../src/db/schema.ts";
import { loadChat, textMessages } from "../../src/lib/pipeline/chat.ts";
import { buildSourceText } from "../../src/lib/quote-check.ts";
import {
  computedSections,
  llmSections,
  type SectionInput,
} from "../../src/lib/pipeline/process.ts";

const CHAT_PATH = process.argv[2] ?? "synthetic-chat.json";

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

  stage(1, "Загрузка");
  const chat = loadChat(CHAT_PATH);
  const texts = textMessages(chat.messages);
  const participants = [...new Set(chat.messages.map((m) => m.from))];
  console.log(`Чат:        ${chat.name}`);
  console.log(`Сообщений:  ${chat.messages.length} (с текстом: ${texts.length})`);
  console.log(`Участники:  ${participants.join(", ")}`);
  console.log(
    `Период:     ${chat.messages[0].date} → ${chat.messages.at(-1)!.date}`,
  );

  stage(2, "Анализ без LLM (код)");
  const computed = computedSections(chat.messages);
  for (const row of computed) {
    console.log(`  ${row.type}: ${row.content.slice(0, 120)}`);
  }

  stage(3, "Извлечение и верификация через Claude API");
  const llm = await llmSections(chat.messages, (msg) => console.log(msg));
  const verified = llm.filter((r) => r.status === "verified").length;
  console.log(`\nverified: ${verified}   flagged: ${llm.length - verified}`);

  stage(4, "Запись в Neon");
  const db = drizzle(neon(process.env.DATABASE_URL));
  const [story] = await db
    .insert(stories)
    .values({
      title: `Переписка: ${chat.name}`,
      sourceName: CHAT_PATH,
      sourceText: buildSourceText(chat.messages),
      messageCount: chat.messages.length,
      status: "ready",
    })
    .returning();
  console.log(`story_id = ${story.id}`);

  const rows: SectionInput[] = [...computed, ...llm];
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
