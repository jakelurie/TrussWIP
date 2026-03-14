import type { Metadata } from "next";
import CategoryPage from "./CategoryPage";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const name = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: `${name} Forum | Truss`,
    description: `Discuss ${name.toLowerCase()} topics with AV technicians and producers on the Truss community forum.`,
    openGraph: {
      title: `${name} Forum | Truss`,
      description: `${name} discussion forum for AV professionals.`,
      type: "website",
      url: `https://trusswork.org/forum/${slug}`,
    },
  };
}

export default async function CategoryPageWrapper({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CategoryPage slug={slug} />;
}
