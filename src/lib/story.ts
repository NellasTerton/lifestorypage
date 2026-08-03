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
  voiceSeconds: number;
  participants: number;
};

export type TopWord = { word: string; count: number };
export type WeekdayBucket = { weekday: string; count: number };
export type HourBucket = { hour: number; count: number };
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
  hours: HourBucket[];
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
  const hourRow = byType("hour_activity")[0];
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
    hours: parseJson<HourBucket[]>(hourRow?.content ?? null, []),
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

/** "A, B и C" — Russian list joining, not an Oxford comma with "and". */
export function joinRu(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} и ${parts.at(-1)}`;
}

/**
 * The voice-message clause for the stats sentence: a number plus its unit
 * label, kept separate so the number can be styled distinctly in JSX.
 * Null when there are no voice messages at all.
 */
export function voicePart(t: TotalStats): { value: number; label: string } | null {
  if (t.voiceMessages <= 0) return null;

  // Duration is only captured on stories uploaded after this feature shipped —
  // older ones have a message count but no seconds. Fall back gracefully.
  if (t.voiceSeconds > 0) {
    const minutes = Math.round(t.voiceSeconds / 60);
    if (minutes >= 60) {
      const hours = Math.round(minutes / 60);
      return { value: hours, label: plural(hours, "час", "часа", "часов") + " голосовых" };
    }
    return {
      value: minutes,
      label: plural(minutes, "минута", "минуты", "минут") + " голосовых",
    };
  }

  return {
    value: t.voiceMessages,
    label: plural(
      t.voiceMessages,
      "голосовое сообщение",
      "голосовых сообщения",
      "голосовых сообщений",
    ),
  };
}

export type Biorhythm = { title: string; text: string };

const NIGHT_HOURS = [1, 2, 3, 4];
const EARLY_HOURS = [5, 6, 7, 8];

/**
 * Names a dominant sleep pattern from the hourly distribution. Thresholds are
 * a judgment call, not a measured cutoff — 15% concentrated in a 4-hour
 * window is already a clear skew for a 24-hour day (uniform would be ~17%).
 */
export function biorhythm(hours: HourBucket[]): Biorhythm | null {
  const total = hours.reduce((sum, h) => sum + h.count, 0);
  if (total === 0) return null;

  const share = (window: number[]) =>
    Math.round(
      (hours.filter((h) => window.includes(h.hour)).reduce((s, h) => s + h.count, 0) /
        total) *
        100,
    );

  const nightPct = share(NIGHT_HOURS);
  const earlyPct = share(EARLY_HOURS);

  if (nightPct >= 15) {
    return {
      title: "Вы — ночные совы",
      text: `${nightPct}% ваших сообщений отправлено после часа ночи.`,
    };
  }
  if (earlyPct >= 15) {
    return {
      title: "Вы — жаворонки",
      text: `${earlyPct}% ваших сообщений отправлено рано утром, до девяти.`,
    };
  }

  const peak = hours.reduce((a, b) => (b.count > a.count ? b : a));
  const period = peak.hour >= 18 || peak.hour < 1 ? "вечером" : "днём";
  return {
    title: "Вы общаетесь без явного ритма",
    text: `Пик переписки — около ${peak.hour}:00, ${period}.`,
  };
}
