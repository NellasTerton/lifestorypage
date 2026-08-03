import { asc, eq } from "drizzle-orm";
import { sections, stories } from "@/db/schema";
import { getDb } from "@/lib/db";

export type TotalStats = {
  messageCount: number;
  daySpan: number;
  firstDate: string;
  lastDate: string;
  photos: number;
  voiceMessages: number;
  participants: number;
};

export type TopWord = { word: string; count: number };
export type WeekdayBucket = { weekday: string; count: number };
export type Phrase = { phrase: string; count: number };

export type Moment = {
  id: number;
  type: "key_moment" | "first_event";
  claim: string;
  sourceQuote: string | null;
  sourceDate: Date | null;
};

export type StoryPageData = {
  story: { id: number; title: string; messageCount: number };
  total: TotalStats | null;
  topWords: TopWord[];
  weekdays: WeekdayBucket[];
  phrases: Phrase[];
  moments: Moment[];
};

/** Section `content` is JSON for computed sections; never trust it blindly. */
function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function getStoryPageData(
  storyId: number,
): Promise<StoryPageData | null> {
  const db = getDb();

  const [story] = await db
    .select()
    .from(stories)
    .where(eq(stories.id, storyId))
    .limit(1);
  if (!story) return null;

  const rows = await db
    .select()
    .from(sections)
    .where(eq(sections.storyId, storyId))
    .orderBy(asc(sections.sourceDate), asc(sections.id));

  const byType = (type: string) => rows.filter((r) => r.type === type);

  const totalRow = byType("total_stats")[0];
  const wordsRow = byType("top_words")[0];
  const weekdayRow = byType("weekday_activity")[0];
  const phraseRow = byType("frequent_phrase")[0];

  // Only verified claims reach the reader. A flagged claim is one the
  // verification pass could not tie to the source text, so it is not shown.
  const moments: Moment[] = rows
    .filter(
      (r) =>
        (r.type === "key_moment" || r.type === "first_event") &&
        r.status === "verified",
    )
    .map((r) => ({
      id: r.id,
      type: r.type as Moment["type"],
      claim: r.content,
      sourceQuote: r.sourceQuote,
      sourceDate: r.sourceDate,
    }));

  return {
    story: {
      id: story.id,
      title: story.title,
      messageCount: story.messageCount,
    },
    total: totalRow ? parseJson<TotalStats | null>(totalRow.content, null) : null,
    topWords: parseJson<TopWord[]>(wordsRow?.content ?? null, []),
    weekdays: parseJson<WeekdayBucket[]>(weekdayRow?.content ?? null, []),
    phrases: parseJson<Phrase[]>(phraseRow?.content ?? null, []),
    moments,
  };
}

const RU_DATE = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDate(date: Date | string | null): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  return Number.isNaN(d.getTime()) ? null : RU_DATE.format(d);
}

/** Russian plural agreement: 1 день, 2 дня, 5 дней. */
export function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
