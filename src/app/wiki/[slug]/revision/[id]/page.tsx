import type { Metadata } from "next";
import RevisionPage from "./RevisionPage";
import { slugToGearId, getGearById } from "@/lib/taxonomy";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const gear = getGearById(slugToGearId(slug));

  const title = gear ? `Revision — ${gear.name} Wiki | Truss` : "Revision | Truss";

  return {
    title,
    description: `Viewing a past revision of the ${gear?.name || "gear"} wiki article.`,
  };
}

export default async function RevisionPageWrapper({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  return <RevisionPage slug={slug} revisionId={id} />;
}
