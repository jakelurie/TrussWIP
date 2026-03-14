import type { Metadata } from "next";
import CrewPlanner from "./CrewPlanner";

export const metadata: Metadata = {
  title: "AI Crew Planner | Truss",
  description:
    "Describe your event and get an AI-generated crew plan with roles, headcounts, and gear recommendations. Built for corporate AV producers.",
  openGraph: {
    title: "AI Crew Planner | Truss",
    description:
      "Describe your event, get a full crew plan. AI-powered crew planning for live events.",
    type: "website",
    url: "https://trusswork.org/crew-planner",
  },
};

export default function Page() {
  return <CrewPlanner />;
}
