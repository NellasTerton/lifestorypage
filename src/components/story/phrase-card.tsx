import { plural, type Phrase } from "@/lib/story";

export function PhraseCard({ phrases }: { phrases: Phrase[] }) {
  const [top, ...rest] = phrases;
  if (!top) return null;

  return (
    <section className="rounded-3xl bg-gradient-to-br from-[oklch(0.955_0.036_44)] to-[oklch(0.958_0.03_88)] p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-2xl font-semibold sm:text-3xl">
        Самая частая фраза
      </h2>

      <div className="mt-6 flex flex-col items-center gap-2 text-center">
        <p className="font-display text-3xl font-semibold text-balance sm:text-4xl">
          «{top.phrase}»
        </p>
        <p className="text-muted-foreground text-sm">
          <span
            className="font-display text-2xl font-semibold tabular-nums"
            style={{ color: "var(--chart-1)" }}
          >
            {top.count}
          </span>{" "}
          {plural(top.count, "раз", "раза", "раз")} за всю переписку
        </p>
      </div>

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
