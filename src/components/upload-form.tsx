"use client";

import Link from "next/link";
import { useActionState } from "react";
import { uploadChat, type UploadState } from "@/app/actions/story";

export function UploadForm() {
  const [state, formAction, pending] = useActionState<UploadState, FormData>(
    uploadChat,
    null,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Название истории{" "}
          <span className="text-muted-foreground font-normal">
            (необязательно)
          </span>
        </label>
        <input
          id="title"
          name="title"
          placeholder="Например: Переписка с Юлей"
          className="bg-card w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="chat" className="text-sm font-medium">
          Файл экспорта
        </label>
        <input
          id="chat"
          name="chat"
          type="file"
          accept="application/json,.json"
          required
          className="bg-card file:bg-secondary file:text-secondary-foreground w-full rounded-xl border px-4 py-2.5 file:mr-4 file:rounded-lg file:border-0 file:px-3 file:py-1.5 file:text-sm"
        />
        <p className="text-muted-foreground text-xs">
          JSON-экспорт из Telegram: Настройки → Экспорт данных, формат JSON.
        </p>
      </div>

      {state?.error && <p className="text-destructive text-sm">{state.error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground rounded-xl px-5 py-2.5 font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Загружаем…" : "Создать историю"}
        </button>
        <Link
          href="/dashboard"
          className="text-muted-foreground text-sm underline underline-offset-4"
        >
          Отмена
        </Link>
      </div>

      {pending && (
        <p className="text-muted-foreground text-sm">
          Статистика появится сразу. Ключевые моменты извлекаются и проверяются
          в фоне — это занимает несколько минут.
        </p>
      )}
    </form>
  );
}
