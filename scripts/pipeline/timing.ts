/** Measures pipeline wall-clock time without touching the database. */
import { loadChat } from "../../src/lib/pipeline/chat.ts";
import { computedSections, llmSections } from "../../src/lib/pipeline/process.ts";

const CHAT = process.argv[2] ?? "synthetic-chat.json";

async function main() {
  const chat = loadChat(CHAT);
  console.log(`Сообщений: ${chat.messages.length}`);

  const t0 = Date.now();
  const computed = computedSections(chat.messages);
  console.log(`Код-статистика: ${Date.now() - t0} мс (${computed.length} секций)`);

  const t1 = Date.now();
  const llm = await llmSections(chat.messages, (m) =>
    console.log(`  [${((Date.now() - t1) / 1000).toFixed(1)}s] ${m}`),
  );
  const tLlm = (Date.now() - t1) / 1000;

  const verified = llm.filter((r) => r.status === "verified").length;
  console.log(`\nLLM-этапы:  ${tLlm.toFixed(1)} с`);
  console.log(`Всего:      ${((Date.now() - t0) / 1000).toFixed(1)} с`);
  console.log(`Секций:     ${computed.length + llm.length}`);
  console.log(`verified: ${verified}   flagged: ${llm.length - verified}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
