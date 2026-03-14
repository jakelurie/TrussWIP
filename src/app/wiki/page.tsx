import type { Metadata } from "next";
import WikiHome from "./WikiHome";

export const metadata: Metadata = {
  title: "Gear Wiki | Truss",
  description:
    "The AV industry's collaborative encyclopedia. Community-edited articles, discussion, and Q&A for 120+ pieces of professional audio, video, lighting, and production equipment.",
  openGraph: {
    title: "Gear Wiki | Truss",
    description:
      "The AV industry's collaborative encyclopedia. Community-edited articles with full revision history.",
    type: "website",
    url: "https://trusswork.org/wiki",
  },
};

export default function WikiPage() {
  return <WikiHome />;
}
