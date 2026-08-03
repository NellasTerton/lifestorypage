import { formatDate, plural, voicePart, type TotalStats } from "@/lib/story";

function Num({ children, tone }: { children: number; tone: string }) {
  return (
    <span
      className="font-display font-semibold tabular-nums"
      style={{ color: tone }}
    >
      {children.toLocaleString("ru-RU")}
    </span>
  );
}

/** Same "A, B и C" joining as story.ts's joinRu, but for JSX nodes. */
function joinRuNodes(parts: React.ReactNode[]): React.ReactNode {
  return parts.map((p, i) => (
    <span key={i}>
      {i > 0 && (i === parts.length - 1 ? " и " : ", ")}
      {p}
    </span>
  ));
}

export function StatsHeader({
  title,
  total,
}: {
  title: string;
  total: TotalStats | null;
}) {
  if (!total) return null;

  const voice = voicePart(total);

  const parts: React.ReactNode[] = [
    <span key="messages">
      <Num tone="var(--chart-2)">{total.messageCount}</Num>{" "}
      {plural(total.messageCount, "сообщение", "сообщения", "сообщений")}
    </span>,
  ];
  if (total.photos > 0) {
    parts.push(
      <span key="photos">
        <Num tone="var(--chart-3)">{total.photos}</Num> фото
      </span>,
    );
  }
  if (voice) {
    parts.push(
      <span key="voice">
        <Num tone="var(--chart-5)">{voice.value}</Num> {voice.label}
      </span>,
    );
  }

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

      <p className="font-display mx-auto mt-8 max-w-xl text-xl leading-relaxed text-balance sm:text-2xl">
        Вы общаетесь уже <Num tone="var(--chart-1)">{total.daySpan}</Num>{" "}
        {plural(total.daySpan, "день", "дня", "дней")}. За это время —{" "}
        {joinRuNodes(parts)}.
      </p>
    </header>
  );
}
