import type { Metadata } from "next";
import VenueSpec from "./VenueSpec";

export const metadata: Metadata = {
  title: "VenueSpec — Crowdsourced Venue Tech Specs | Truss",
  description:
    "Crowdsourced technical specifications for event venues — power, rigging, loading dock, internet, audio, video, lighting, and staging notes from techs who've worked there.",
  openGraph: {
    title: "VenueSpec — Crowdsourced Venue Tech Specs | Truss",
    description:
      "Real venue tech specs from AV professionals. Power, rigging, loading, internet, and production notes.",
    type: "website",
    url: "https://trusswork.org/venues",
  },
};

export default function Page() {
  return <VenueSpec />;
}
