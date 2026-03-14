import type { Metadata } from "next";
import GearPage from "./GearPage";
import { slugToGearId, getGearById } from "@/lib/taxonomy";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const gear = getGearById(slugToGearId(slug));

  const title = gear ? `${gear.name} — Gear Wiki | Truss` : "Gear Wiki | Truss";
  const desc = gear
    ? `Tips, known issues, and Q&A for the ${gear.name} by ${gear.manufacturer}. Real-world notes from AV professionals.`
    : "AV gear knowledge base from Truss.";

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "article",
      url: `https://trusswork.org/wiki/${slug}`,
    },
  };
}

export default async function GearPageWrapper({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <GearPage slug={slug} />;
}
