import type { TopWord } from "@/lib/story";

const TONES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function WordCloud({ words }: { words: TopWord[] }) {
  if (words.length === 0) return null;

  const max = Math.max(...words.map((w) => w.count));
  const min = Math.min(...words.map((w) => w.count));
  const span = Math.max(max - min, 1);

  return (
    <section className="bg-card rounded-3xl border p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-2xl font-semibold sm:text-3xl">
        Слова, которые повторялись чаще всего
      </h2>

      <div className="mt-6 flex flex-wrap items-baseline justify-center gap-x-5 gap-y-3">
        {words.map((w, i) => {
          // Map frequency onto 1rem–3rem so the cloud stays readable at both ends.
          const size = 1 + ((w.count - min) / span) * 2;
          return (
            <span
              key={w.word}
              title={`${w.count}`}
              className="leading-tight font-semibold transition-opacity hover:opacity-70"
              style={{
                fontSize: `${size.toFixed(2)}rem`,
                color: TONES[i % TONES.length],
                opacity: 0.65 + ((w.count - min) / span) * 0.35,
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </section>
  );
}
