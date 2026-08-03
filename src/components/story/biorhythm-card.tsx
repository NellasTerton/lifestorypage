import { biorhythm, type HourBucket } from "@/lib/story";

export function BiorhythmCard({ hours }: { hours: HourBucket[] }) {
  const result = biorhythm(hours);
  if (!result) return null;

  const max = Math.max(...hours.map((h) => h.count), 1);

  return (
    <section className="bg-card rounded-3xl border p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-2xl font-semibold sm:text-3xl">
        Ваши биоритмы
      </h2>

      <p className="font-display mt-4 text-xl font-semibold sm:text-2xl">
        {result.title}
      </p>
      <p className="text-muted-foreground mt-1 text-sm sm:text-base">
        {result.text}
      </p>

      {/* Hour-of-day heatmap: 24 bars, one per hour, tall where you write more. */}
      <div className="mt-6 flex items-end gap-[3px]">
        {hours.map((h) => {
          const intensity = h.count / max;
          const isNight = h.hour >= 22 || h.hour <= 5;
          return (
            <div
              key={h.hour}
              title={`${h.hour}:00 — ${h.count}`}
              className="min-w-0 flex-1 rounded-sm"
              style={{
                height: `${8 + intensity * 44}px`,
                backgroundColor: isNight ? "var(--chart-5)" : "var(--chart-1)",
                opacity: 0.3 + intensity * 0.7,
              }}
            />
          );
        })}
      </div>
      <div className="text-muted-foreground mt-1.5 flex justify-between text-xs tabular-nums">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </section>
  );
}
