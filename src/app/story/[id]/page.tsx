import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Moments } from "@/components/story/moments";
import { PhraseCard } from "@/components/story/phrase-card";
import { StatsHeader } from "@/components/story/stats-header";
import { WeekdayChart } from "@/components/story/weekday-chart";
import { WordCloud } from "@/components/story/word-cloud";
import { getStoryPageData } from "@/lib/story";

// Public and shareable, so it is cached — sections never change after the
// pipeline run that produced them.
export const revalidate = 300;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getStoryPageData(Number(id));
  if (!data) return { title: "История не найдена" };
  return {
    title: data.story.title,
    description: "История переписки, собранная из ваших сообщений",
  };
}

export default async function StoryPage({ params }: Props) {
  const { id } = await params;
  const storyId = Number(id);
  if (!Number.isInteger(storyId) || storyId <= 0) notFound();

  const data = await getStoryPageData(storyId);
  if (!data) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-14">
      <StatsHeader title={data.story.title} total={data.total} />

      <div className="mt-10 space-y-10 sm:mt-14 sm:space-y-14">
        <Moments moments={data.moments} />
        <PhraseCard phrases={data.phrases} />
        <WordCloud words={data.topWords} />
        <WeekdayChart weekdays={data.weekdays} />
      </div>

      <footer className="text-muted-foreground mt-14 border-t pt-6 text-center text-xs">
        Каждое утверждение на этой странице проверено отдельным проходом по
        исходным сообщениям.
      </footer>
    </main>
  );
}
