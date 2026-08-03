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
  // Conversational filler: frequent in any chat, so it says nothing about
  // this one. Without these the cloud fills up with "привет" and "норм".
  "привет", "приветик", "пока", "спасибо", "пожалуйста", "ладно", "хорошо",
  "норм", "нормально", "окей", "оке", "угу", "нету", "こ", "喂",
  "сейчас", "сегодня", "завтра", "вчера", "потом", "скоро", "давай", "давайте",
  "прям", "прямо", "точно", "кстати", "вроде", "кажется", "думаю", "знаю",
  "понял", "поняла", "看", "смотри", "слушай", "короче", "типа", "блин",
  "какие", "какой", "какая", "какое", "таких", "такие", "такое", "такая",
  "буду", "будет", "будем", "будешь", "была", "были", "было", "быть",
  "есть", "нету", "надо", "нужно", "можно", "хочу", "хочешь", "хочет",
  "день", "дня", "дней", "раз", "разу", "человек", "люди", "всем", "весь",
  "хотя", "significa", "сделал", "сделала", "делать", "сказал", "сказала",
  "https", "http", "www", "com", "жизни", "жизнь", "который", "которая",
  "которые", "которых", "жду", "ждать", "иду", "идти", "пришел", "пришла",
]);

/** Strips URLs before tokenising so link fragments never reach the cloud. */
function stripUrls(text: string): string {
  return text.replace(/https?:\/\/\S+|www\.\S+|\S+\.(?:ru|com|org|net)\b/gi, " ");
}

/**
 * Crude Russian stem: inflections of one word are the same word to a reader,
 * so "работу" and "работы" should not take two slots in the cloud.
 * Prefix-based rather than rule-based — over-merging a rare pair costs less
 * here than showing the same word three times.
 */
function stemKey(word: string): string {
  return word.length >= 6 ? word.slice(0, 5) : word;
}

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
    voiceSeconds: messages.reduce((sum, m) => sum + m.voiceSeconds, 0),
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
  // Group inflections under one stem, then label the group with whichever
  // surface form actually appeared most often.
  const groups = new Map<string, { total: number; forms: Map<string, number> }>();

  for (const m of messages) {
    for (const w of tokenize(stripUrls(m.text))) {
      if (w.length < 4 || STOPWORDS.has(w) || /^\d+$/.test(w)) continue;
      const key = stemKey(w);
      const g = groups.get(key) ?? { total: 0, forms: new Map() };
      g.total += 1;
      g.forms.set(w, (g.forms.get(w) ?? 0) + 1);
      groups.set(key, g);
    }
  }

  return [...groups.values()]
    .map((g) => {
      const [word] = [...g.forms.entries()].sort((a, b) => b[1] - a[1])[0];
      return { word, count: g.total };
    })
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit);
}

export type HourBucket = { hour: number; count: number };

/** Message counts per hour of day — the basis for the biorhythm section. */
export function hourActivity(messages: ChatMessage[]): HourBucket[] {
  const counts = new Array(24).fill(0);
  for (const m of messages) {
    const d = new Date(m.date);
    if (!Number.isNaN(d.getTime())) counts[d.getHours()] += 1;
  }
  return counts.map((count, hour) => ({ hour, count }));
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
