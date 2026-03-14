import type { Metadata } from "next";
import CableBible from "./CableBible";

export const metadata: Metadata = {
  title: "Cable Bible — AV Connector Reference | Truss",
  description:
    "Complete reference guide to audio, video, data, and power connectors used in live events and corporate AV. Pinouts, specs, and compatibility notes.",
  openGraph: {
    title: "Cable Bible — AV Connector Reference | Truss",
    description:
      "Complete reference guide to AV connectors, pinouts, and specs for live events.",
    type: "website",
    url: "https://trusswork.org/tools/cable-bible",
  },
};

export default function Page() {
  return <CableBible />;
}
