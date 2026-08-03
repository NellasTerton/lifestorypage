import Link from "next/link";
import { redirect } from "next/navigation";
import { UploadForm } from "@/components/upload-form";
import { getUserId } from "@/lib/auth";

export const metadata = { title: "Загрузить чат" };
// The pipeline runs inside this route's function. A 600-message chat measures
// ~49s, so 60 is the ceiling that works on every Vercel plan (Hobby caps
// there; Pro would allow up to 300).
export const maxDuration = 60;

export default async function UploadPage() {
  if (!(await getUserId())) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/dashboard"
        className="text-muted-foreground text-sm underline-offset-4 hover:underline"
      >
        ← Мои истории
      </Link>

      <h1 className="font-display mt-4 text-3xl font-semibold sm:text-4xl">
        Загрузить новый чат
      </h1>

      <section
        className="mt-6 rounded-2xl p-5 text-sm leading-relaxed"
        style={{ backgroundColor: "var(--secondary)" }}
      >
        <p className="font-medium">Как выгрузить чат из Telegram</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Откройте Telegram Desktop и зайдите в нужный чат</li>
          <li>
            Меню чата <span className="opacity-60">→</span> Экспорт истории чата
          </li>
          <li>
            В поле «Формат» выберите <strong>JSON</strong> (не HTML)
          </li>
          <li>Загрузите получившийся файл <code>result.json</code> ниже</li>
        </ol>
        <p className="text-muted-foreground mt-3">
          Нужен именно JSON-файл. Сейчас поддерживается наша структура экспорта —
          полный разбор формата Telegram Desktop появится следующим шагом.
        </p>
      </section>

      <UploadForm />
    </main>
  );
}
