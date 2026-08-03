import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { CopyLinkButton } from "@/components/copy-link-button";
import { stories } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatDate, plural } from "@/lib/story";

export const metadata = { title: "Мои истории" };
// Stories change as uploads finish, so never serve this from cache.
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  processing: "Обрабатывается",
  failed: "Ошибка обработки",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rows = await getDb()
    .select()
    .from(stories)
    .where(eq(stories.userId, user.id))
    .orderBy(desc(stories.createdAt));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">
            Мои истории
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Вы вошли как {user.username}
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-muted-foreground rounded-xl border px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)]"
          >
            Выйти
          </button>
        </form>
      </div>

      <Link
        href="/dashboard/upload"
        className="bg-primary text-primary-foreground mt-8 inline-flex rounded-xl px-5 py-2.5 font-medium transition-opacity hover:opacity-90"
      >
        Загрузить новый чат
      </Link>

      {rows.length === 0 ? (
        <p className="text-muted-foreground bg-card mt-8 rounded-2xl border border-dashed p-8 text-center text-sm">
          Пока нет ни одной истории. Загрузите экспорт переписки, чтобы создать
          первую.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {rows.map((story) => (
            <li key={story.id}>
              <Link
                href={`/story/${story.id}`}
                className="bg-card block rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="font-display text-xl font-semibold">
                    {story.title}
                  </h2>
                  {STATUS_LABEL[story.status] && (
                    <span
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor:
                          story.status === "failed"
                            ? "var(--destructive)"
                            : "var(--secondary)",
                        color:
                          story.status === "failed"
                            ? "var(--primary-foreground)"
                            : "var(--secondary-foreground)",
                      }}
                    >
                      {STATUS_LABEL[story.status]}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-muted-foreground text-sm">
                    {story.messageCount.toLocaleString("ru-RU")}{" "}
                    {plural(story.messageCount, "сообщение", "сообщения", "сообщений")}
                    {" · "}
                    {formatDate(story.createdAt)}
                  </p>
                  <CopyLinkButton path={`/story/${story.id}`} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
