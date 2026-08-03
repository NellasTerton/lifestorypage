import { asc, desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { sections, stories } from "@/db/schema";
import { getDb } from "@/lib/db";

export const metadata = { title: "Админка — секции" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ story?: string }> };

export default async function AdminPage({ searchParams }: Props) {
  const { story } = await searchParams;
  const storyId = Number(story);
  const filtered = Number.isInteger(storyId) && storyId > 0;

  const db = getDb();

  const allStories = await db
    .select({
      id: stories.id,
      title: stories.title,
      messageCount: stories.messageCount,
      createdAt: stories.createdAt,
    })
    .from(stories)
    .orderBy(desc(stories.id));

  // flagged first, then computed, then verified.
  const statusOrder = sql`case ${sections.status} when 'flagged' then 0 when 'computed' then 1 else 2 end`;

  const rows = await db
    .select({
      id: sections.id,
      storyId: sections.storyId,
      type: sections.type,
      content: sections.content,
      sourceQuote: sections.sourceQuote,
      status: sections.status,
      note: sections.verificationNote,
    })
    .from(sections)
    .where(filtered ? eq(sections.storyId, storyId) : undefined)
    .orderBy(statusOrder, asc(sections.storyId), asc(sections.id));

  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main style={{ padding: 16, fontFamily: "monospace" }}>
      <h1>Секции ({rows.length})</h1>

      <p style={{ lineHeight: 2 }}>
        История:{" "}
        <Link
          href="/admin"
          style={{ fontWeight: filtered ? "normal" : "bold", marginRight: 8 }}
        >
          все
        </Link>
        {allStories.map((s) => (
          <Link
            key={s.id}
            href={`/admin?story=${s.id}`}
            style={{
              marginRight: 8,
              fontWeight: filtered && storyId === s.id ? "bold" : "normal",
            }}
          >
            #{s.id} {s.title} ({s.messageCount})
          </Link>
        ))}
      </p>

      <p>
        {Object.entries(counts)
          .map(([status, n]) => `${status}: ${n}`)
          .join(" · ") || "нет секций"}
      </p>

      <table border={1} cellPadding={6} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>id</th>
            <th>story_id</th>
            <th>status</th>
            <th>type</th>
            <th>claim (content)</th>
            <th>source_quote</th>
            <th>verification_note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.storyId}</td>
              <td>{r.status}</td>
              <td>{r.type}</td>
              <td style={{ maxWidth: 420 }}>{r.content}</td>
              <td style={{ maxWidth: 320 }}>{r.sourceQuote ?? "—"}</td>
              <td style={{ maxWidth: 420 }}>{r.note ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
