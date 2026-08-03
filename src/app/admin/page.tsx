import { asc, desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { sections, stories } from "@/db/schema";
import { getDb } from "@/lib/db";
import { quoteMatches } from "@/lib/quote-check";

export const metadata = { title: "Админка — секции" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ story?: string; story_id?: string }>;
};

const ROW_BG: Record<string, string> = {
  flagged: "#fdeaea",
  verified: "#eaf7ec",
  computed: "#f2f2f2",
};

export default async function AdminPage({ searchParams }: Props) {
  const params = await searchParams;
  // Both spellings work — ?story= and ?story_id= are equally guessable.
  const storyId = Number(params.story ?? params.story_id);
  const filtered = Number.isInteger(storyId) && storyId > 0;

  const db = getDb();

  const allStories = await db
    .select({
      id: stories.id,
      title: stories.title,
      messageCount: stories.messageCount,
      sourceText: stories.sourceText,
    })
    .from(stories)
    .orderBy(desc(stories.id));

  const sourceById = new Map(allStories.map((s) => [s.id, s.sourceText]));

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

  const checked = rows.map((r) => ({
    ...r,
    match: quoteMatches(r.sourceQuote, sourceById.get(r.storyId) ?? null),
  }));

  const counts = checked.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const checkable = checked.filter((r) => r.match !== null);
  const matched = checkable.filter((r) => r.match).length;

  const cell: React.CSSProperties = {
    padding: "10px 12px",
    verticalAlign: "top",
    borderBottom: "1px solid #ddd",
  };

  return (
    <main
      style={{
        padding: 20,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <h1 style={{ fontSize: 20, margin: "0 0 12px" }}>
        Секции ({checked.length})
      </h1>

      <p style={{ lineHeight: 2.2, margin: "0 0 10px" }}>
        История:{" "}
        <Link
          href="/admin"
          style={{ fontWeight: filtered ? 400 : 700, marginRight: 10 }}
        >
          все
        </Link>
        {allStories.map((s) => (
          <Link
            key={s.id}
            href={`/admin?story=${s.id}`}
            style={{
              marginRight: 10,
              fontWeight: filtered && storyId === s.id ? 700 : 400,
            }}
          >
            #{s.id} {s.title} ({s.messageCount})
          </Link>
        ))}
      </p>

      <p style={{ margin: "0 0 6px" }}>
        {Object.entries(counts)
          .map(([status, n]) => `${status}: ${n}`)
          .join(" · ") || "нет секций"}
      </p>

      <p style={{ margin: "0 0 16px", color: "#555" }}>
        quote_match: {matched}/{checkable.length} цитат найдены в исходнике
        дословно
        {checkable.length < checked.length &&
          ` · ${checked.length - checkable.length} без проверки (нет исходного текста или цитаты)`}
      </p>

      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          tableLayout: "fixed",
        }}
      >
        <thead>
          <tr style={{ background: "#e4e4e4", textAlign: "left" }}>
            <th style={{ ...cell, width: 52 }}>id</th>
            <th style={{ ...cell, width: 58 }}>story</th>
            <th style={{ ...cell, width: 88 }}>status</th>
            <th style={{ ...cell, width: 96 }}>quote_match</th>
            <th style={{ ...cell, width: 118 }}>type</th>
            <th style={cell}>claim (content)</th>
            <th style={cell}>source_quote</th>
            <th style={cell}>verification_note</th>
          </tr>
        </thead>
        <tbody>
          {checked.map((r, i) => (
            <tr
              key={r.id}
              style={{
                // Status colour first; zebra striping only shades it slightly.
                background: ROW_BG[r.status] ?? "#fff",
                boxShadow: i % 2 ? "inset 0 0 0 9999px rgba(0,0,0,0.025)" : undefined,
              }}
            >
              <td style={cell}>{r.id}</td>
              <td style={cell}>{r.storyId}</td>
              <td style={cell}>{r.status}</td>
              <td style={{ ...cell, textAlign: "center", fontSize: 16 }}>
                {r.match === null ? (
                  <span style={{ color: "#999" }} title="Нет исходника или цитаты">
                    —
                  </span>
                ) : r.match ? (
                  <span style={{ color: "#1a7f37" }} title="Цитата найдена в исходнике">
                    ✅
                  </span>
                ) : (
                  <strong
                    style={{ color: "#c00" }}
                    title="Цитата не найдена в исходнике"
                  >
                    ❌
                  </strong>
                )}
              </td>
              <td style={cell}>{r.type}</td>
              <td style={{ ...cell, wordBreak: "break-word" }}>{r.content}</td>
              <td style={{ ...cell, wordBreak: "break-word" }}>
                {r.sourceQuote ?? "—"}
              </td>
              <td style={{ ...cell, wordBreak: "break-word", color: "#444" }}>
                {r.note ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
