import type { Metadata } from "next";
import ForumHome from "./ForumHome";

export const metadata: Metadata = {
  title: "Community Forum | Truss",
  description:
    "AV technician community forum. Discuss audio, video, lighting, staging, and production with fellow techs and producers.",
  openGraph: {
    title: "Community Forum | Truss",
    description:
      "AV technician community forum. Discuss audio, video, lighting, staging, and production.",
    type: "website",
    url: "https://trusswork.org/forum",
  },
};

export default function ForumPage() {
  return <ForumHome />;
}
