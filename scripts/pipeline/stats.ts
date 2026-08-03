import type { ChatMessage } from "./chat.ts";

/**
 * Deterministic (non-LLM) analysis. Everything here is computed straight from
 * the corpus, so results need no verification pass — they are reproducible.
 */

const STOPWORDS = new Set([
  "и", "в", "во", "не", "что", "он", "на", "я", "с", "со", "как", "а", "то",
  "все", "она", "так", "его", "но", "да", "ты", "к", "у", "же", "вы", "за",
  "бы", "по", "только", "ее", "мне", "было", "вот", "от", "меня", "еще",
  "нет", "о", "из", "ему", "теперь", "когда", "даже", "ну", "вдруг", "ли",
  "если", "уже", "или", "ни", "быть", "был", "него", "до", "вас", "нибудь",
  "опять", "уж", "вам", "ведь", "там", "потом", "себя", "ничего", "ей",
  "может", "они", "тут", "где", "есть", "надо", "ней", "для", "мы", "тебя",
  "их", "чем", "была", "сам", "чтоб", "без", "будто", "чего", "раз", "тоже",
  "себе", "под", "будет", "ж", "тогда", "кто", "этот", "того", "потому",
  "этого", "какой", "совсем", "ним", "здесь", "этом", "один", "почти", "мой",
  "тем", "чтобы", "нее", "были", "куда", "зачем", "всех", "никогда", "можно",
  "при", "наконец", "два", "об", "другой", "хоть", "после", "над", "больше",
  "тот", "через", "эти", "нас", "про", "всего", "них", "какая", "много",
  "разве", "три", "эту", "моя", "впрочем", "хорошо", "свою", "этой", "перед",
  "иногда", "лучше", "чуть", "том", "нельзя", "такой", "им", "более", "всегда",
  "конечно", "всю", "между", "это", "как-то", "просто", "очень", "тебе",
  "меня", "нам", "вообще", "а-а", "аа", "ага", "да-да",
]);

export type TotalStats = {
  messageCount: number;
  daySpan: number;
  firstDate: string;
  lastDate: string;
  photos: number;
  voiceMessages: number;
  participants: number;
};

export function totalStats(messages: ChatMessage[]): TotalStats {
  const first = messages[0];
  const last = messages[messages.length - 1];
  const msPerDay = 1000 * 60 * 60 * 24;
  const daySpan = Math.floor(
    (new Date(last.date).getTime() - new Date(first.date).getTime()) / msPerDay,
  );

  return {
    messageCount: messages.length,
    daySpan,
    firstDate: first.date,
    lastDate: last.date,
    photos: messages.filter((m) => m.photo).length,
    voiceMessages: messages.filter((m) => m.voice).length,
    participants: new Set(messages.map((m) => m.from)).size,
  };
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-zа-яё0-9]+/gi) ?? []).map((w) =>
    w.replace(/ё/g, "е"),
  );
}

export type TopWord = { word: string; count: number };

export function topWords(messages: ChatMessage[], limit = 20): TopWord[] {
  const counts = new Map<string, number>();
  for (const m of messages) {
    for (const w of tokenize(m.text)) {
      if (w.length < 4 || STOPWORDS.has(w)) continue;
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit);
}

const WEEKDAYS = [
  "воскресенье", "понедельник", "вторник", "среда",
  "четверг", "пятница", "суббота",
];

export type WeekdayBucket = { weekday: string; count: number };

export function weekdayActivity(messages: ChatMessage[]): WeekdayBucket[] {
  const counts = new Array(7).fill(0);
  for (const m of messages) {
    const d = new Date(m.date);
    if (!Number.isNaN(d.getTime())) counts[d.getDay()] += 1;
  }
  // Report Monday-first, which is how a Russian-language reader expects it.
  return [1, 2, 3, 4, 5, 6, 0].map((day) => ({
    weekday: WEEKDAYS[day],
    count: counts[day],
  }));
}

export type PhraseHit = {
  phrase: string;
  count: number;
  exampleMessageIds: number[];
};

/**
 * Most repeated multi-word phrase. Scores n-grams by count * length so a
 * 4-word phrase repeated 8 times beats a 2-word phrase repeated 10 times —
 * longer repeated phrases are the more interesting finding.
 */
export function frequentPhrases(
  messages: ChatMessage[],
  { minWords = 2, maxWords = 5, minCount = 3, limit = 5 } = {},
): PhraseHit[] {
  const hits = new Map<string, { count: number; ids: number[] }>();

  for (const m of messages) {
    const words = tokenize(m.text);
    for (let n = minWords; n <= maxWords; n++) {
      for (let i = 0; i + n <= words.length; i++) {
        const gram = words.slice(i, i + n);
        // Skip n-grams that are only filler words.
        if (gram.every((w) => STOPWORDS.has(w) || w.length < 3)) continue;
        const key = gram.join(" ");
        const entry = hits.get(key) ?? { count: 0, ids: [] };
        entry.count += 1;
        if (entry.ids.length < 5) entry.ids.push(m.id);
        hits.set(key, entry);
      }
    }
  }

  return [...hits.entries()]
    .filter(([, v]) => v.count >= minCount)
    .map(([phrase, v]) => ({
      phrase,
      count: v.count,
      exampleMessageIds: v.ids,
      score: v.count * phrase.split(" ").length,
    }))
    .sort((a, b) => b.score - a.score || b.count - a.count)
    .slice(0, limit)
    .map(({ phrase, count, exampleMessageIds }) => ({
      phrase,
      count,
      exampleMessageIds,
    }));
}
