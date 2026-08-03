"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { sections, stories } from "@/db/schema";
import { getUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parseChat, type ChatMessage } from "@/lib/pipeline/chat";
import { computedSections, llmSections } from "@/lib/pipeline/process";

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

  let chat: { name: string; messages: ChatMessage[] };
  try {
    chat = parseChat(JSON.parse(await file.text()));
  } catch {
    return { error: "Не удалось прочитать файл. Нужен JSON-экспорт из Telegram." };
  }
  if (chat.messages.length === 0) {
    return { error: "В файле нет сообщений." };
  }

  const db = getDb();
  const title = String(formData.get("title") ?? "").trim() || `Переписка: ${chat.name}`;

  const [story] = await db
    .insert(stories)
    .values({
      userId,
      title,
      sourceName: file.name,
      messageCount: chat.messages.length,
      status: "processing",
    })
    .returning({ id: stories.id });

  // Deterministic sections are instant, so the story page has content to show
  // straight away rather than sitting empty while the model works.
  await db
    .insert(sections)
    .values(
      computedSections(chat.messages).map((s) => ({ ...s, storyId: story.id })),
    );

  // Extraction + verification take minutes — far longer than a request should
  // last, so they run after the response is sent and flip status when done.
  after(async () => {
    try {
      const rows = await llmSections(chat.messages);
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
    revalidatePath("/dashboard");
    revalidatePath(`/story/${story.id}`);
  });

  redirect(`/story/${story.id}`);
}
