import { redirect } from "next/navigation";
import { UploadForm } from "@/components/upload-form";
import { getUserId } from "@/lib/auth";

export const metadata = { title: "Загрузить чат" };

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
