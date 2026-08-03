import { redirect } from "next/navigation";
import { UploadForm } from "@/components/upload-form";
import { getUserId } from "@/lib/auth";

export const metadata = { title: "Загрузить чат" };
// The upload action's after() work runs inside this route's function. A
// 600-message chat measures ~49s, so 60 is the ceiling that works on every
// Vercel plan (Hobby caps there; Pro would allow up to 300).
export const maxDuration = 60;

export default async function UploadPage() {
  if (!(await getUserId())) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">
        Загрузить новый чат
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Из переписки соберётся история: статистика, ключевые моменты и первые
        события — каждое подтверждённое цитатой.
      </p>

      <UploadForm />
    </main>
  );
}
