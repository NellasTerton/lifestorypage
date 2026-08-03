import { asc, sql } from "drizzle-orm";
import { sections } from "@/db/schema";
import { getDb } from "@/lib/db";

export const metadata = { title: "Админка — секции" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // flagged first, then computed, then verified.
  const rows = await getDb()
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
    .orderBy(
      sql`case ${sections.status} when 'flagged' then 0 when 'computed' then 1 else 2 end`,
      asc(sections.storyId),
      asc(sections.id),
    );

  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main style={{ padding: 16, fontFamily: "monospace" }}>
      <h1>Секции ({rows.length})</h1>
      <p>
        {Object.entries(counts)
          .map(([status, n]) => `${status}: ${n}`)
          .join(" · ")}
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
