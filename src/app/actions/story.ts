"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { sections, stories } from "@/db/schema";
import { getUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parseChat, validateChatShape, type ChatMessage } from "@/lib/pipeline/chat";
import { computedSections, llmSections } from "@/lib/pipeline/process";
import { buildSourceText } from "@/lib/quote-check";

export type UploadState = { error: string } | null;

const MAX_BYTES = 20 * 1024 * 1024;

export async function uploadChat(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const file = formData.get("chat");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Выберите файл с экспортом чата." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Файл больше 20 МБ." };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    return { error: "Это не JSON-файл — не удалось его прочитать." };
  }

  const shapeError = validateChatShape(raw);
  if (shapeError) return { error: shapeError };

  const chat = parseChat(raw);
  if (chat.messages.length === 0) {
    return { error: "В файле нет сообщений, которые можно разобрать." };
  }

  const db = getDb();
  const title =
    String(formData.get("title") ?? "").trim() || `Переписка: ${chat.name}`;

  const [story] = await db
    .insert(stories)
    .values({
      userId,
      title,
      sourceName: file.name,
      sourceText: buildSourceText(chat.messages),
      messageCount: chat.messages.length,
      status: "processing",
    })
    .returning({ id: stories.id });

  // Deterministic sections first: if the LLM stages fail or time out, the
  // story still exists with real content rather than being lost entirely.
  await db
    .insert(sections)
    .values(
      computedSections(chat.messages).map((s) => ({ ...s, storyId: story.id })),
    );

  try {
    const rows = await runLlmStages(chat.messages);
    if (rows.length > 0) {
      await db
        .insert(sections)
        .values(rows.map((s) => ({ ...s, storyId: story.id })));
    }
    await db
      .update(stories)
      .set({ status: "ready" })
      .where(eq(stories.id, story.id));
  } catch (err) {
    console.error(`story ${story.id}: LLM stages failed`, err);
    await db
      .update(stories)
      .set({ status: "failed" })
      .where(eq(stories.id, story.id));
  }

  // Outside the try: redirect() signals by throwing, so catching it here
  // would swallow the navigation.
  redirect(`/story/${story.id}`);
}

function runLlmStages(messages: ChatMessage[]) {
  return llmSections(messages);
}
