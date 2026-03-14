import type { Metadata } from "next";
import DayRateCalculator from "./DayRateCalculator";

export const metadata: Metadata = {
  title: "Freelance AV Technician Day Rate Calculator | Truss",
  description:
    "Calculate your freelance day rate based on target annual income. Factors in self-employment tax, health insurance, gear costs, and slow months. Built for AV technicians.",
  keywords: [
    "freelance AV technician day rate calculator",
    "freelance day rate calculator",
    "AV technician day rate",
    "freelance rate calculator",
    "audio engineer day rate calculator",
    "video technician rate calculator",
    "lighting technician day rate",
    "freelance AV rates",
    "self employment tax calculator freelance",
    "how to set freelance rate",
  ],
  openGraph: {
    title: "Freelance AV Technician Day Rate Calculator | Truss",
    description:
      "Calculate the day rate you need to charge as a freelance AV technician. Accounts for taxes, insurance, gear, and slow months.",
    type: "website",
    url: "https://trusswork.org/tools/day-rate-calculator",
  },
};

export default function Page() {
  return <DayRateCalculator />;
}