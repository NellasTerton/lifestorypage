import { plural, type Phrase } from "@/lib/story";

export function PhraseCard({ phrases }: { phrases: Phrase[] }) {
  const [top, ...rest] = phrases;
  if (!top) return null;

  return (
    <section className="rounded-3xl bg-gradient-to-br from-[oklch(0.955_0.036_44)] to-[oklch(0.958_0.03_88)] p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-2xl font-semibold sm:text-3xl">
        Самая частая фраза
      </h2>

      <p className="font-display mt-6 text-center text-2xl leading-relaxed text-balance sm:text-3xl">
        Вы написали друг другу «{top.phrase}» целых{" "}
        <span
          className="font-semibold tabular-nums"
          style={{ color: "var(--chart-1)" }}
        >
          {top.count}
        </span>{" "}
        {plural(top.count, "раз", "раза", "раз")}
      </p>

      {rest.length > 0 && (
        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {rest.map((p) => (
            <li
              key={p.phrase}
              className="bg-card/70 rounded-full px-4 py-1.5 text-sm"
            >
              «{p.phrase}»{" "}
              <span className="text-muted-foreground tabular-nums">
                {p.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
