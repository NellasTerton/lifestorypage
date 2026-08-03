/**
 * Refreshes the deterministic parts of an already-extracted story:
 * recomputes `total_stats` and fills `source_date` on every section.
 *
 * Exists so schema additions don't force a re-run of the paid LLM stages —
 * nothing here calls the API.
 */
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { sections } from "../../src/db/schema.ts";
import { loadChat, type ChatMessage } from "../../src/lib/pipeline/chat.ts";
import { totalStats } from "../../src/lib/pipeline/stats.ts";

const CHAT_PATH = process.argv[2] ?? "synthetic-chat.json";
const STORY_ID = Number(process.argv[3] ?? 1);

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL не задан.");
    process.exit(1);
  }

  const chat = loadChat(CHAT_PATH);
  const byId = new Map<number, ChatMessage>(chat.messages.map((m) => [m.id, m]));
  const db = drizzle(neon(process.env.DATABASE_URL));

  const rows = await db
    .select()
    .from(sections)
    .where(eq(sections.storyId, STORY_ID));
  console.log(`Секций у story_id=${STORY_ID}: ${rows.length}`);

  // 1. Recompute total_stats with the new photo/voice/participant fields.
  const total = totalStats(chat.messages);
  const totalRow = rows.find((r) => r.type === "total_stats");
  if (totalRow) {
    await db
      .update(sections)
      .set({ content: JSON.stringify(total) })
      .where(eq(sections.id, totalRow.id));
    console.log("total_stats обновлён:", total);
  }

  // 2. Fill source_date from the earliest cited message.
  let filled = 0;
  for (const row of rows) {
    if (row.sourceDate || row.sourceMessageIds.length === 0) continue;

    const times = row.sourceMessageIds
      .map((id) => byId.get(id)?.date)
      .filter((d): d is string => Boolean(d))
      .map((d) => new Date(d).getTime())
      .filter((t) => !Number.isNaN(t));
    if (times.length === 0) continue;

    await db
      .update(sections)
      .set({ sourceDate: new Date(Math.min(...times)) })
      .where(eq(sections.id, row.id));
    filled += 1;
  }
  console.log(`source_date заполнено у ${filled} секций.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
