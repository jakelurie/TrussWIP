import type { Metadata } from "next";
import SignalFlow from "./SignalFlow";

export const metadata: Metadata = {
  title: "AV Signal Flow Simulator — Build & Validate Signal Chains | Truss",
  description:
    "Interactive signal flow simulator for audio, video, and lighting. Drag gear blocks onto a canvas, connect them, and validate your signal chain in real time. Learn correct signal flow order for live event production.",
  keywords: [
    "AV signal flow simulator",
    "audio signal chain builder",
    "video signal flow diagram",
    "lighting DMX signal chain",
    "live event signal flow",
    "AV technician training tool",
    "signal chain validation",
    "audio signal path",
    "video routing diagram",
    "DMX signal flow",
    "AV production signal flow",
    "sound system signal chain",
  ],
  openGraph: {
    title: "AV Signal Flow Simulator — Build & Validate Signal Chains | Truss",
    description:
      "Interactive signal flow simulator for audio, video, and lighting. Drag gear, connect signal chains, and validate in real time.",
    type: "website",
    url: "https://trusswork.org/tools/signal-flow",
  },
};

export default function Page() {
  return <SignalFlow />;
}
