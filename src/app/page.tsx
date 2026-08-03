import Link from "next/link";

export const metadata = {
  title: "Lifestorypage — ваша переписка как история",
  description:
    "Соберите из экспорта чата тёплую историю: статистика, ключевые моменты с датами и цитатами, публичная ссылка.",
};

const FEATURES = [
  {
    title: "Статистика переписки",
    text: "Сколько дней вы переписывались, сколько сообщений, фото и голосовых — крупными цифрами.",
    tone: "var(--chart-1)",
  },
  {
    title: "Ключевые моменты",
    text: "Поворотные точки вашей истории — с точной датой и дословной цитатой из сообщения.",
    tone: "var(--chart-2)",
  },
  {
    title: "Первые события",
    text: "Первое «скучаю», первое свидание, первый разговор о будущем — найдены и подписаны цитатой.",
    tone: "var(--chart-3)",
  },
  {
    title: "Топ-слова",
    text: "Облако слов, которые вы повторяли чаще всего за все годы переписки.",
    tone: "var(--chart-5)",
  },
  {
    title: "Активность по дням",
    text: "В какие дни недели вы писали друг другу больше всего — наглядным графиком.",
    tone: "var(--chart-4)",
  },
  {
    title: "Ссылка для друзей",
    text: "Готовая история открывается по ссылке у любого — без регистрации и входа.",
    tone: "var(--chart-1)",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "0",
    note: "навсегда",
    features: [
      "1 история",
      "Статистика переписки",
      "Топ-слова",
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

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6 sm:px-6">
        <span className="font-display text-lg font-semibold">Lifestorypage</span>
        <Link
          href="/login"
          className="text-muted-foreground text-sm underline-offset-4 hover:underline"
        >
          Войти
        </Link>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-20 sm:px-6">
        <section className="rounded-3xl bg-gradient-to-br from-[oklch(0.955_0.038_62)] via-[oklch(0.968_0.03_40)] to-[oklch(0.955_0.032_20)] px-6 py-16 text-center shadow-sm sm:px-12 sm:py-24">
          <h1 className="font-display text-4xl leading-tight font-semibold text-balance sm:text-6xl">
            Ваша переписка — теперь красивая история
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg text-balance sm:text-xl">
            Тысячи сообщений, которые вы больше никогда не откроете, снова
            становятся историей: с датами, цитатами и тем, что между вами
            происходило на самом деле.
          </p>
          <Link
            href="/register"
            className="bg-primary text-primary-foreground mt-10 inline-flex rounded-2xl px-8 py-4 text-lg font-medium shadow-sm transition-opacity hover:opacity-90"
          >
            Начать
          </Link>
        </section>

        <section className="mt-20">
          <h2 className="font-display text-center text-3xl font-semibold sm:text-4xl">
            Что окажется в вашей истории
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="bg-card rounded-2xl border p-6 shadow-sm"
              >
                <span
                  className="block size-3 rounded-full"
                  style={{ backgroundColor: f.tone }}
                />
                <h3 className="font-display mt-4 text-xl font-semibold">
                  {f.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {f.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="font-display text-center text-3xl font-semibold sm:text-4xl">
            Тарифы
          </h2>
          <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
            {PLANS.map((p) => (
              <article
                key={p.name}
                className={`rounded-3xl border p-7 shadow-sm ${
                  p.highlight
                    ? "bg-gradient-to-br from-[oklch(0.955_0.036_44)] to-[oklch(0.958_0.03_88)]"
                    : "bg-card"
                }`}
                style={
                  p.highlight ? { borderColor: "var(--chart-1)" } : undefined
                }
              >
                <h3 className="font-display text-2xl font-semibold">{p.name}</h3>
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
      </main>

      <footer className="text-muted-foreground border-t px-4 py-8 text-center text-xs">
        Lifestorypage — каждое утверждение в истории проверено по исходным
        сообщениям.
      </footer>
    </div>
  );
}
