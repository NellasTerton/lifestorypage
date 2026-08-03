"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useActionState } from "react";
import { uploadChat, type UploadState } from "@/app/actions/story";

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export function UploadForm() {
  const [state, formAction, pending] = useActionState<UploadState, FormData>(
    uploadChat,
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function takeFiles(files: FileList | null) {
    if (!files?.length || !inputRef.current) return;
    const dt = new DataTransfer();
    dt.items.add(files[0]);
    inputRef.current.files = dt.files;
    setFileName(files[0].name);
  }

  // The pipeline calls Claude for extraction and verification, which runs for
  // roughly a minute — without this state the page looks frozen.
  if (pending) {
    return (
      <div className="bg-card mt-8 rounded-2xl border p-10 text-center shadow-sm">
        <span style={{ color: "var(--chart-1)" }}>
          <Spinner />
        </span>
        <p className="font-display mt-5 text-xl font-semibold">
          Анализируем вашу переписку…
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          Это займёт около минуты: мы находим ключевые моменты и проверяем
          каждый по исходным сообщениям. Не закрывайте страницу.
        </p>
      </div>
    );
  }

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

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          takeFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragging ? "bg-[var(--secondary)]" : "bg-card"
        }`}
        style={dragging ? { borderColor: "var(--chart-1)" } : undefined}
      >
        <input
          ref={inputRef}
          id="chat"
          name="chat"
          type="file"
          accept="application/json,.json"
          required
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
        {fileName ? (
          <>
            <p className="font-medium">{fileName}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Нажмите, чтобы выбрать другой файл
            </p>
          </>
        ) : (
          <>
            <p className="font-medium">Перетащите JSON-файл сюда</p>
            <p className="text-muted-foreground mt-1 text-sm">
              или нажмите, чтобы выбрать файл
            </p>
          </>
        )}
      </div>

      {state?.error && (
        <p
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            backgroundColor: "var(--accent)",
            color: "var(--accent-foreground)",
          }}
        >
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="bg-primary text-primary-foreground rounded-xl px-5 py-2.5 font-medium transition-opacity hover:opacity-90"
        >
          Создать историю
        </button>
        <Link
          href="/dashboard"
          className="text-muted-foreground text-sm underline underline-offset-4"
        >
          Отмена
        </Link>
      </div>
    </form>
  );
}
