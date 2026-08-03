import { formatDate, type Moment } from "@/lib/story";

function MomentCard({ moment }: { moment: Moment }) {
  const isFirst = moment.type === "first_event";
  const date = formatDate(moment.sourceDate);

  return (
    <li className="relative pl-8 sm:pl-10">
      <span
        className="absolute top-7 left-0 size-3 -translate-x-1/2 rounded-full ring-4 ring-[var(--background)]"
        style={{
          backgroundColor: isFirst ? "var(--chart-3)" : "var(--chart-1)",
        }}
      />
      <article className="bg-card rounded-2xl border p-5 shadow-sm sm:p-6">
        {isFirst && (
          <span
            className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-medium tracking-wide"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--accent-foreground)",
            }}
          >
            Первое
          </span>
        )}

        <p className="text-base leading-relaxed sm:text-lg">{moment.claim}</p>

        {moment.sourceQuote && (
          <blockquote
            className="mt-4 border-l-2 pl-4 text-sm italic sm:text-base"
            style={{
              borderColor: "var(--chart-2)",
              color: "var(--muted-foreground)",
            }}
          >
            «{moment.sourceQuote}»
          </blockquote>
        )}

        {date && (
          <p className="text-muted-foreground mt-3 text-xs">
            по сообщению от {date}
          </p>
        )}
      </article>
    </li>
  );
}

export function Moments({ moments }: { moments: Moment[] }) {
  if (moments.length === 0) return null;

  return (
    <section>
      <h2 className="font-display text-2xl font-semibold sm:text-3xl">
        Как это было
      </h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Каждый момент подтверждён цитатой из переписки.
      </p>

      <ol className="mt-8 space-y-5 border-l border-dashed border-[oklch(0.88_0.03_60)]">
        {moments.map((m) => (
          <MomentCard key={m.id} moment={m} />
        ))}
      </ol>
    </section>
  );
}
