import type { Metadata } from "next";
import ContractTemplates from "./ContractTemplates";

export const metadata: Metadata = {
  title: "Free Contract Templates for AV Technicians | Truss",
  description:
    "Free downloadable contract templates for freelance AV technicians. Service agreements, rate confirmation emails, invoice templates, W-9 explainer, and COI request templates. Copy, customize, and send.",
  keywords: [
    "freelance AV contract template",
    "AV technician invoice template",
    "freelance audio engineer contract",
    "AV technician service agreement",
    "freelance event tech contract",
    "AV freelancer invoice",
    "rate confirmation email template",
    "certificate of insurance request AV",
    "W-9 freelance technician",
    "independent contractor agreement AV",
    "live event technician contract",
    "freelance production contract template",
  ],
  openGraph: {
    title: "Free Contract Templates for AV Technicians | Truss",
    description:
      "Service agreements, invoices, rate confirmations, and more. Free templates built for freelance AV work.",
    type: "website",
    url: "https://trusswork.org/tools/contract-templates",
  },
};

export default function Page() {
  return <ContractTemplates />;
}
