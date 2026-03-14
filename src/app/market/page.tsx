import type { Metadata } from "next";
import MarketIntelligence from "./MarketIntelligence";

export const metadata: Metadata = {
  title: "AV Market Intelligence | Truss",
  description:
    "Live AV labor market data — rates by role, demand by city, experience distribution, and hiring trends from the Truss marketplace.",
  openGraph: {
    title: "AV Market Intelligence | Truss",
    description:
      "Live rate benchmarks, demand trends, and labor market insights for corporate AV.",
    type: "website",
    url: "https://trusswork.org/market",
  },
};

export default function Page() {
  return <MarketIntelligence />;
}
