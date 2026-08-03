import type { WeekdayBucket } from "@/lib/story";

export function WeekdayChart({ weekdays }: { weekdays: WeekdayBucket[] }) {
  if (weekdays.length === 0) return null;

  const max = Math.max(...weekdays.map((d) => d.count), 1);
  const peak = weekdays.reduce((a, b) => (b.count > a.count ? b : a));

  return (
    <section className="bg-card rounded-3xl border p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-2xl font-semibold sm:text-3xl">
        Когда вы писали друг другу
      </h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Чаще всего — в {peak.weekday}.
      </p>

      <div className="mt-6 space-y-3">
        {weekdays.map((d) => (
          <div key={d.weekday} className="flex items-center gap-3">
            <span className="text-muted-foreground w-28 shrink-0 text-sm capitalize sm:w-32">
              {d.weekday}
            </span>
            <div className="bg-muted h-7 flex-1 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max((d.count / max) * 100, 1.5)}%`,
                  backgroundColor:
                    d.weekday === peak.weekday
                      ? "var(--chart-1)"
                      : "var(--chart-2)",
                }}
              />
            </div>
            <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums">
              {d.count}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
