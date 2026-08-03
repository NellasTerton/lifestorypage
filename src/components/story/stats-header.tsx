import { formatDate, plural, type TotalStats } from "@/lib/story";

function Stat({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-3 py-5 sm:px-6">
      <span
        className="font-display text-5xl leading-none font-semibold tabular-nums sm:text-6xl"
        style={{ color: tone }}
      >
        {value.toLocaleString("ru-RU")}
      </span>
      <span className="text-muted-foreground text-xs tracking-wide uppercase sm:text-sm">
        {label}
      </span>
    </div>
  );
}

export function StatsHeader({
  title,
  total,
}: {
  title: string;
  total: TotalStats | null;
}) {
  if (!total) return null;

  // Photo and voice counters only appear when the export actually has them —
  // a row of zeroes would read as a broken page rather than an empty chat.
  const stats = [
    {
      value: total.daySpan,
      label: plural(total.daySpan, "день переписки", "дня переписки", "дней переписки"),
      tone: "var(--chart-1)",
    },
    {
      value: total.messageCount,
      label: plural(total.messageCount, "сообщение", "сообщения", "сообщений"),
      tone: "var(--chart-2)",
    },
    ...(total.photos > 0
      ? [
          {
            value: total.photos,
            label: plural(total.photos, "фото", "фото", "фото"),
            tone: "var(--chart-3)",
          },
        ]
      : []),
    ...(total.voiceMessages > 0
      ? [
          {
            value: total.voiceMessages,
            label: plural(
              total.voiceMessages,
              "голосовое",
              "голосовых",
              "голосовых",
            ),
            tone: "var(--chart-5)",
          },
        ]
      : []),
    {
      value: total.participants,
      label: plural(total.participants, "участник", "участника", "участников"),
      tone: "var(--chart-4)",
    },
  ];

  return (
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[oklch(0.955_0.038_62)] via-[oklch(0.968_0.03_40)] to-[oklch(0.955_0.032_20)] px-6 py-12 text-center shadow-sm sm:px-12 sm:py-16">
      <p className="text-muted-foreground text-sm tracking-[0.2em] uppercase">
        История переписки
      </p>
      <h1 className="font-display mt-3 text-3xl font-semibold text-balance sm:text-5xl">
        {title}
      </h1>
      <p className="text-muted-foreground mt-4 text-sm sm:text-base">
        {formatDate(total.firstDate)} — {formatDate(total.lastDate)}
      </p>

      <div className="mt-10 flex flex-wrap items-start justify-center divide-x divide-[oklch(0.88_0.03_60)]">
        {stats.map((s) => (
          <Stat key={s.label} {...s} />
        ))}
      </div>
    </header>
  );
}
