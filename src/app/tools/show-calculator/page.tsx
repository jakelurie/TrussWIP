import type { Metadata } from "next";
import ShowCalculator from "./ShowCalculator";

export const metadata: Metadata = {
  title: "Show Calculator — Crew & Gear Planner | Truss",
  description:
    "Input your event details and get crew and gear recommendations. Covers corporate general sessions, concerts, trade shows, broadcasts, galas, and conferences.",
  openGraph: {
    title: "Show Calculator — Crew & Gear Planner | Truss",
    description:
      "Input event details, get crew and gear recommendations for live events and corporate AV.",
    type: "website",
    url: "https://trusswork.org/tools/show-calculator",
  },
};

export default function Page() {
  return <ShowCalculator />;
}
