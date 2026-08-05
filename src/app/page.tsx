import Link from "next/link";

export const metadata = {
  title: "Lifestorypage — ваша переписка как история",
  description:
    "Соберите из экспорта чата тёплую историю: статистика, ключевые моменты с датами и цитатами, публичная ссылка.",
};

/* -------------------------------------------------------------------------- */
/* Sample data — illustrative content used only to preview the product on the  */
/* landing page. Not tied to any real story.                                   */
/* -------------------------------------------------------------------------- */

// 24 hours of made-up activity with an evening/late-night skew, so the
// preview heatmap looks like a real night-owl couple.
const SAMPLE_HOURS = [
  12, 9, 4, 1, 0, 0, 0, 2, 6, 10, 14, 18, 22, 19, 15, 13, 17, 24, 31, 38, 42,
  36, 27, 19,
];

const SAMPLE_WORDS = [
  { word: "скучаю", size: 30 },
  { word: "домой", size: 22 },
  { word: "завтра", size: 26 },
  { word: "люблю", size: 34 },
  { word: "кофе", size: 18 },
  { word: "вечером", size: 24 },
  { word: "поехали", size: 20 },
  { word: "обнимаю", size: 28 },
  { word: "работа", size: 16 },
  { word: "выходные", size: 22 },
];

const SAMPLE_WEEKDAYS = [
  { day: "Пн", count: 24 },
  { day: "Вт", count: 19 },
  { day: "Ср", count: 31 },
  { day: "Чт", count: 22 },
  { day: "Пт", count: 44 },
  { day: "Сб", count: 58 },
  { day: "Вс", count: 41 },
];

const STATS = [
  { value: "709", label: "дней вместе", tone: "var(--chart-1)" },
  { value: "12 480", label: "сообщений разобрано", tone: "var(--chart-2)" },
  { value: "37", label: "моментов найдено", tone: "var(--chart-3)" },
  { value: "100%", label: "проверено по цитате", tone: "var(--chart-5)" },
];

const STEPS = [
  {
    n: "1",
    title: "Выгрузите чат",
    text: "Экспорт переписки из Telegram — один JSON-файл. Мы разбираем его целиком, ничего не теряя.",
  },
  {
    n: "2",
    title: "Разбор и проверка",
    text: "Считаем статистику и находим ключевые моменты. Каждый факт отдельно сверяется с исходным сообщением.",
  },
  {
    n: "3",
    title: "Готовая ссылка",
    text: "Получаете красивую историю по ссылке — можно открыть с любого устройства и подарить.",
  },
];

const TESTIMONIALS = [
  {
    text: "Подарил на годовщину — она листала и плакала. Увидеть первые сообщения снова это что-то.",
    name: "Артём",
  },
  {
    text: "Думала, будет сухая статистика. А получилась настоящая история, с нашими же словами.",
    name: "Марина",
  },
  {
    text: "Больше всего зацепило, что под каждым моментом стоит настоящая цитата. Ничего не выдумано.",
    name: "Дмитрий",
  },
  {
    text: "Сделали к переезду в новую квартиру. Теперь это первое, что открываем гостям.",
    name: "Катя и Егор",
  },
  {
    text: "График по часам показал, что мы оба совы. Смеялись весь вечер.",
    name: "Лена",
  },
  {
    text: "Отправила маме — она вообще не разбирается в технике, но всё открылось по ссылке сразу.",
    name: "Полина",
  },
];

/* -------------------------------------------------------------------------- */
/* Small presentational pieces                                                 */
/* -------------------------------------------------------------------------- */

function BiorhythmBars({ hours }: { hours: number[] }) {
  const max = Math.max(...hours, 1);
  return (
    <div className="flex items-end gap-[3px]">
      {hours.map((count, hour) => {
        const intensity = count / max;
        const isNight = hour >= 22 || hour <= 5;
        return (
          <div
            key={hour}
            className="min-w-0 flex-1 rounded-sm"
            style={{
              height: `${6 + intensity * 40}px`,
              backgroundColor: isNight ? "var(--chart-5)" : "var(--chart-1)",
              opacity: 0.3 + intensity * 0.7,
            }}
          />
        );
      })}
    </div>
  );
}

/** A verified claim with its source quote and a proof check — the core unit. */
function VerifiedMoment({
  claim,
  quote,
  date,
}: {
  claim: string;
  quote: string;
  date: string;
}) {
  return (
    <div className="bg-card rounded-2xl border p-5 text-left shadow-sm">
      <div className="flex items-start gap-2.5">
        <span
          className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-xs text-white"
          style={{ backgroundColor: "var(--chart-4)" }}
          aria-hidden
        >
          ✓
        </span>
        <p className="text-sm leading-relaxed sm:text-base">{claim}</p>
      </div>
      <p
        className="mt-3 border-l-2 pl-3 text-sm italic"
        style={{ borderColor: "var(--chart-1)", color: "var(--muted-foreground)" }}
      >
        «{quote}»
      </p>
      <p className="text-muted-foreground mt-2 text-xs">по сообщению от {date}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <span className="font-display text-lg font-semibold">Lifestorypage</span>
        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="text-muted-foreground text-sm underline-offset-4 hover:underline"
          >
            Войти
          </Link>
          <Link
            href="/register"
            className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-opacity hover:opacity-90"
          >
            Создать историю
          </Link>
        </div>
      </header>

      <main className="w-full">
        {/* ---------------------------------------------------------------- */}
        {/* Hero                                                             */}
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div className="text-center lg:text-left">
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--accent-foreground)",
              }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: "var(--chart-4)" }}
              />
              Каждый факт проверен по исходному сообщению
            </span>
            <h1 className="font-display mt-6 text-4xl leading-tight font-semibold text-balance sm:text-6xl">
              Ваша переписка — теперь красивая история
            </h1>
            <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg text-balance sm:text-xl lg:mx-0">
              Тысячи сообщений, которые вы больше никогда не откроете, снова
              становятся историей: с датами, цитатами и тем, что между вами
              происходило на самом деле.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
              <Link
                href="/register"
                className="bg-primary text-primary-foreground inline-flex w-full justify-center rounded-2xl px-8 py-4 text-lg font-medium shadow-sm transition-opacity hover:opacity-90 sm:w-auto"
              >
                Начать бесплатно
              </Link>
              <Link
                href="/story/1"
                className="bg-card inline-flex w-full justify-center rounded-2xl border px-8 py-4 text-lg font-medium shadow-sm transition-colors hover:bg-secondary sm:w-auto"
              >
                Живой пример →
              </Link>
            </div>
            <p className="text-muted-foreground mt-4 text-sm">
              Просмотр истории — без регистрации
            </p>
          </div>

          {/* Sample story card: a compact preview of a real story page. */}
          <div className="relative">
            <div
              className="absolute -inset-4 -z-10 rounded-[2.5rem] opacity-70 blur-2xl"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.9 0.06 40), oklch(0.92 0.05 330))",
              }}
              aria-hidden
            />
            <div className="bg-card rounded-3xl border p-6 shadow-xl sm:p-8">
              <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
                История переписки
              </p>
              <h2 className="font-display mt-2 text-2xl font-semibold">
                Юля и Алекс
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                15 января 2024 — 24 декабря 2025
              </p>

              <p className="font-display mt-5 text-lg leading-relaxed">
                Вы общаетесь уже{" "}
                <span
                  className="font-semibold tabular-nums"
                  style={{ color: "var(--chart-1)" }}
                >
                  709
                </span>{" "}
                дней. За это время —{" "}
                <span
                  className="font-semibold tabular-nums"
                  style={{ color: "var(--chart-2)" }}
                >
                  600
                </span>{" "}
                сообщений и{" "}
                <span
                  className="font-semibold tabular-nums"
                  style={{ color: "var(--chart-3)" }}
                >
                  44
                </span>{" "}
                фото.
              </p>

              <div className="mt-5">
                <VerifiedMoment
                  claim="Алекс впервые признался, что думает о Юле."
                  quote="А я думаю о тебе, если честно"
                  date="11 февраля 2024 г."
                />
              </div>

              <div className="mt-5">
                <p className="text-muted-foreground mb-2 text-xs">
                  Биоритмы — когда вы писали друг другу
                </p>
                <BiorhythmBars hours={SAMPLE_HOURS} />
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Numbers band                                                     */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-y bg-card/60">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p
                  className="font-display text-4xl font-semibold tabular-nums sm:text-5xl"
                  style={{ color: s.tone }}
                >
                  {s.value}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Live preview — what a finished story actually shows              */}
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="text-center">
            <p
              className="text-sm font-medium tracking-[0.2em] uppercase"
              style={{ color: "var(--chart-1)" }}
            >
              Живой пример
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold text-balance sm:text-4xl">
              Не просто цифры — целая история с данными
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-balance">
              Каждая история — это статистика, биоритмы, самые частые слова и
              фразы, активность по дням и проверенные моменты. Вот как это
              выглядит.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {/* Frequent phrase */}
            <article className="rounded-3xl bg-gradient-to-br from-[oklch(0.955_0.036_44)] to-[oklch(0.958_0.03_88)] p-6 shadow-sm md:col-span-2">
              <h3 className="font-display text-lg font-semibold">
                Самая частая фраза
              </h3>
              <p className="font-display mt-4 text-2xl leading-relaxed text-balance sm:text-3xl">
                Вы написали друг другу «скучаю по тебе» целых{" "}
                <span
                  className="font-semibold tabular-nums"
                  style={{ color: "var(--chart-1)" }}
                >
                  48
                </span>{" "}
                раз
              </p>
            </article>

            {/* Biorhythm */}
            <article className="bg-card rounded-3xl border p-6 shadow-sm">
              <h3 className="font-display text-lg font-semibold">Биоритмы</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Вы — ночные совы. 34% сообщений — после часа ночи.
              </p>
              <div className="mt-5">
                <BiorhythmBars hours={SAMPLE_HOURS} />
              </div>
            </article>

            {/* Word cloud */}
            <article className="bg-card rounded-3xl border p-6 shadow-sm">
              <h3 className="font-display text-lg font-semibold">
                Частые слова
              </h3>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                {SAMPLE_WORDS.map((w) => (
                  <span
                    key={w.word}
                    className="font-display font-medium leading-tight"
                    style={{
                      fontSize: `${w.size}px`,
                      color:
                        w.size > 28
                          ? "var(--chart-1)"
                          : w.size > 22
                            ? "var(--chart-3)"
                            : "var(--muted-foreground)",
                    }}
                  >
                    {w.word}
                  </span>
                ))}
              </div>
            </article>

            {/* Weekday chart */}
            <article className="bg-card rounded-3xl border p-6 shadow-sm">
              <h3 className="font-display text-lg font-semibold">
                Активность по дням
              </h3>
              <div className="mt-5 flex items-end justify-between gap-2">
                {SAMPLE_WEEKDAYS.map((d) => {
                  const max = Math.max(...SAMPLE_WEEKDAYS.map((x) => x.count));
                  return (
                    <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                      <div
                        className="w-full rounded-md"
                        style={{
                          height: `${20 + (d.count / max) * 70}px`,
                          backgroundColor: "var(--chart-2)",
                        }}
                      />
                      <span className="text-muted-foreground text-xs">
                        {d.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </article>

            {/* Verified moment */}
            <article className="bg-card rounded-3xl border p-6 shadow-sm">
              <h3 className="font-display mb-4 text-lg font-semibold">
                Ключевой момент
              </h3>
              <VerifiedMoment
                claim="Они решили съехаться и начали искать квартиру вместе."
                quote="Тогда давай смотреть по-настоящему. Я составлю список"
                date="18 мая 2025 г."
              />
            </article>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/story/1"
              className="bg-card inline-flex rounded-2xl border px-7 py-3.5 font-medium shadow-sm transition-colors hover:bg-secondary"
            >
              Открыть пример целиком →
            </Link>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Verification differentiator                                      */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-y bg-card/60">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
            <div>
              <p
                className="text-sm font-medium tracking-[0.2em] uppercase"
                style={{ color: "var(--chart-4)" }}
              >
                Почему нам можно верить
              </p>
              <h2 className="font-display mt-3 text-3xl font-semibold text-balance sm:text-4xl">
                Ничего не выдумано
              </h2>
              <p className="text-muted-foreground mt-4 text-balance">
                Красивую историю легко сочинить. Мы делаем наоборот: каждое
                утверждение проходит отдельную проверку и показывается только
                если под ним стоит настоящая цитата из вашей переписки. Не нашли
                подтверждения — не показываем.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Каждый факт сверяется с исходным сообщением",
                  "Под каждым моментом — точная цитата и дата",
                  "Статистика считается по всему корпусу, без округлений в свою пользу",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-xs text-white"
                      style={{ backgroundColor: "var(--chart-4)" }}
                      aria-hidden
                    >
                      ✓
                    </span>
                    <span className="text-sm sm:text-base">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <VerifiedMoment
                claim="Юля первой написала Алексу после знакомства на дне рождения."
                quote="Привет! Это Юля, мы вчера у Кати болтали про Исландию)"
                date="15 января 2024 г."
              />
              <VerifiedMoment
                claim="После поездки к морю оба назвали её лучшим отпуском."
                quote="Это был лучший отпуск за много лет"
                date="6 июля 2024 г."
              />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* How it works                                                     */}
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <h2 className="font-display text-center text-3xl font-semibold text-balance sm:text-4xl">
            Как это работает
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <article
                key={s.n}
                className="bg-card rounded-3xl border p-7 shadow-sm"
              >
                <span
                  className="font-display grid size-12 place-items-center rounded-2xl text-xl font-semibold text-white"
                  style={{ backgroundColor: "var(--chart-1)" }}
                >
                  {s.n}
                </span>
                <h3 className="font-display mt-5 text-xl font-semibold">
                  {s.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {s.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Testimonials                                                     */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-y bg-card/60">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <h2 className="font-display text-center text-3xl font-semibold text-balance sm:text-4xl">
              Что говорят те, кто уже подарил
            </h2>
            <div className="mt-12 columns-1 gap-5 sm:columns-2 lg:columns-3">
              {TESTIMONIALS.map((t) => (
                <figure
                  key={t.name}
                  className="bg-card mb-5 break-inside-avoid rounded-2xl border p-6 shadow-sm"
                >
                  <blockquote className="text-sm leading-relaxed sm:text-base">
                    «{t.text}»
                  </blockquote>
                  <figcaption className="text-muted-foreground mt-4 text-sm font-medium">
                    {t.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Pricing                                                          */}
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <h2 className="font-display text-center text-3xl font-semibold text-balance sm:text-4xl">
            Тарифы
          </h2>
          <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
            {PLANS.map((p) => (
              <article
                key={p.name}
                className={`rounded-3xl border p-7 shadow-sm ${
                  p.highlight
                    ? "bg-gradient-to-br from-[oklch(0.955_0.036_44)] to-[oklch(0.958_0.03_88)]"
                    : "bg-card"
                }`}
                style={p.highlight ? { borderColor: "var(--chart-1)" } : undefined}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl font-semibold">
                    {p.name}
                  </h3>
                  {p.highlight && (
                    <span
                      className="rounded-full px-3 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: "var(--chart-1)" }}
                    >
                      Популярный
                    </span>
                  )}
                </div>
                <p className="mt-3 flex items-baseline gap-1.5">
                  <span
                    className="font-display text-5xl font-semibold"
                    style={{ color: "var(--chart-1)" }}
                  >
                    ${p.price}
                  </span>
                  <span className="text-muted-foreground text-sm">{p.note}</span>
                </p>

                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-sm">
                      <span style={{ color: "var(--chart-1)" }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`mt-7 block rounded-xl px-5 py-3 text-center font-medium transition-opacity hover:opacity-90 ${
                    p.highlight
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  Начать
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Final CTA                                                         */}
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-br from-[oklch(0.955_0.038_62)] via-[oklch(0.968_0.03_40)] to-[oklch(0.955_0.032_20)] px-6 py-16 text-center shadow-sm sm:px-12 sm:py-20">
            <h2 className="font-display text-3xl font-semibold text-balance sm:text-5xl">
              Соберите вашу историю сегодня
            </h2>
            <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-lg text-balance">
              Первая история — бесплатно. Нужен только экспорт вашего чата.
            </p>
            <Link
              href="/register"
              className="bg-primary text-primary-foreground mt-9 inline-flex rounded-2xl px-8 py-4 text-lg font-medium shadow-sm transition-opacity hover:opacity-90"
            >
              Начать бесплатно
            </Link>
          </div>
        </section>
      </main>

      <footer className="text-muted-foreground border-t px-4 py-8 text-center text-xs">
        Lifestorypage — каждое утверждение в истории проверено по исходным
        сообщениям.
      </footer>
    </div>
  );
}

const PLANS = [
  {
    name: "Free",
    price: "0",
    note: "навсегда",
    features: [
      "1 история",
      "Статистика переписки",
      "Топ-слова и биоритмы",
      "Активность по дням недели",
      "Публичная ссылка",
    ],
    highlight: false,
  },
  {
    name: "Premium",
    price: "4.99",
    note: "в месяц",
    features: [
      "Безлимит историй",
      "Всё из Free",
      "Ключевые моменты с цитатами",
      "Первые события",
      "Проверка каждого факта по источнику",
    ],
    highlight: true,
  },
];
