import type { Metadata } from "next";
import QuestionPage from "./QuestionPage";
import { createClient } from "@supabase/supabase-js";
import { slugToGearId, getGearById } from "@/lib/taxonomy";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }): Promise<Metadata> {
  const { slug, id } = await params;
  const gear = getGearById(slugToGearId(slug));

  const { data: question } = await supabaseServer
    .from("wiki_questions")
    .select("title, body")
    .eq("id", id)
    .single();

  const title = question?.title
    ? `${question.title} — ${gear?.name || "Gear Wiki"} | Truss`
    : `Q&A — ${gear?.name || "Gear Wiki"} | Truss`;
  const desc = question?.body?.slice(0, 160) || `Questions and answers about ${gear?.name || "AV gear"}.`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "article",
      url: `https://trusswork.org/wiki/${slug}/question/${id}`,
    },
  };
}

export default async function QuestionPageWrapper({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  return <QuestionPage slug={slug} questionId={id} />;
}
