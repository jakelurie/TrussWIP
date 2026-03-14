import type { Metadata } from "next";
import RFCoordination from "./RFCoordination";

export const metadata: Metadata = {
  title: "Wireless Microphone Frequency Coordination Guide | Truss",
  description:
    "RF frequency reference for wireless microphone coordination. Shure, Sennheiser, and Wisycom frequency blocks, FCC 600MHz restrictions by city, intermodulation basics, and channel stacking rules of thumb.",
  keywords: [
    "wireless microphone frequency coordination guide",
    "RF coordination wireless microphones",
    "Shure frequency blocks",
    "Shure G50 H50 J50A frequency range",
    "FCC 600MHz repack wireless microphones",
    "wireless microphone intermodulation",
    "UHF wireless frequency coordination",
    "Axient Digital frequency bands",
    "Sennheiser EW-D frequency bands",
    "wireless microphone channel stacking",
    "RF coordination corporate AV",
    "how many wireless microphones per block",
  ],
  openGraph: {
    title: "Wireless Microphone Frequency Coordination Guide | Truss",
    description:
      "RF frequency reference for wireless microphone coordination. Frequency blocks, FCC restrictions, intermod basics, and channel stacking rules.",
    type: "website",
    url: "https://trusswork.org/tools/rf-coordination",
  },
};

export default function Page() {
  return <RFCoordination />;
}