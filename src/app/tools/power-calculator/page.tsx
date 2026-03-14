import type { Metadata } from "next";
import PowerCalculator from "./PowerCalculator";

export const metadata: Metadata = {
  title: "AV Power Calculator for Event Production | Truss",
  description:
    "Calculate total power draw for your AV gear list. Add consoles, amplifiers, LED walls, moving lights, projectors, and more. See circuit counts, load percentages, and 80% derating warnings.",
  keywords: [
    "AV power calculator event production",
    "event power calculator",
    "AV gear power draw calculator",
    "stage power requirements calculator",
    "LED wall power draw",
    "moving light power calculator",
    "amplifier power draw amps",
    "audio console power requirements",
    "120V 20A circuit calculator",
    "event production power planning",
    "AV technical production tools",
  ],
  openGraph: {
    title: "AV Power Calculator for Event Production | Truss",
    description:
      "Calculate total power draw for your AV gear list. Circuit counts, load percentages, and 80% derating warnings.",
    type: "website",
    url: "https://trusswork.org/tools/power-calculator",
  },
};

export default function Page() {
  return <PowerCalculator />;
}