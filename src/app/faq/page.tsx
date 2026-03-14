import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | Truss",
  description:
    "Frequently asked questions about Truss — the marketplace for freelance AV technicians and event producers. Pricing, payments, how it works, and more.",
  openGraph: {
    title: "FAQ | Truss",
    description: "Frequently asked questions about Truss.",
    url: "https://trusswork.org/faq",
  },
};

interface FaqItem {
  q: string;
  a: string;
}

interface FaqSection {
  heading: string;
  items: FaqItem[];
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    heading: "General",
    items: [
      {
        q: "What is Truss?",
        a: "Truss is a marketplace that connects freelance AV technicians with the event producers who need them. Techs create profiles with their skills, gear, rates, and availability. Producers search, review, and book directly — no agency in the middle.",
      },
      {
        q: "Who is Truss for?",
        a: "Truss is built for two groups: freelance AV technicians (audio engineers, video engineers, lighting designers, stagehands, TDs, and more) and event producers who hire them for corporate events, conferences, concerts, and live productions.",
      },
      {
        q: "Is Truss an agency or staffing company?",
        a: "No. Truss is a marketplace, not an agency. We don't employ techs, set rates, or take a cut of anyone's earnings. Techs and producers connect directly. We provide the platform and tools — the relationship is between you and your client.",
      },
      {
        q: "What cities does Truss cover?",
        a: "Truss is available nationwide. We currently have rate data and landing pages for 15 major AV markets including San Francisco, Los Angeles, New York, Las Vegas, Chicago, Dallas, Orlando, Nashville, Atlanta, Seattle, Denver, and Miami. Techs and producers in any US city can use the platform.",
      },
    ],
  },
  {
    heading: "For Technicians",
    items: [
      {
        q: "How much does it cost to create a profile?",
        a: "Nothing. Truss is free for technicians. Create your profile, set your rates, list your gear, and get found by producers — no subscription, no listing fee.",
      },
      {
        q: "Does Truss take a commission on my earnings?",
        a: "No. When a producer books you through Truss, you keep 100% of your rate. There are no platform fees, commissions, or hidden charges deducted from your pay.",
      },
      {
        q: "How do I set my rate?",
        a: "You set your own rate per skill on your profile. You can check our Rate Guide for average day rates by role and city to see where you fall in the market. Your rate is visible to producers when they browse.",
      },
      {
        q: "Do I need to sign a non-compete?",
        a: "No. You own your profile and your client relationships. There are no non-competes, exclusivity clauses, or restrictions on working with clients you meet through Truss.",
      },
      {
        q: "How do payments work?",
        a: "When a producer confirms a booking, payment is secured through Stripe. After the gig is marked complete, funds are released to your connected bank account within 2 business days. You set up payouts once through your dashboard.",
      },
      {
        q: "What roles can I list?",
        a: "Truss covers 21 crew roles across 6 departments: Audio (A1, A2), Video (V1, V2, GFX, CAM, LED, PROJ), Lighting (L1, L2, SPOT), Staging & Rigging (SH, PWR, CARP), IT & Networking (NET, BRK, IT), and Production & Management (TD, LT, TP, PM).",
      },
    ],
  },
  {
    heading: "For Producers",
    items: [
      {
        q: "How much does it cost to use Truss as a producer?",
        a: "Creating a producer account is free. You can browse profiles, view rates, and search by role, city, and availability at no cost. Fees are only applied when you confirm a booking — a small service fee is added to secure the transaction and handle payment processing.",
      },
      {
        q: "How do I find techs?",
        a: "Use the Browse page to search by role, city, rate range, and availability. Each tech profile shows their skills, gear list, experience level, reviews, and rate. You can also save searches and get notified when new techs match your criteria.",
      },
      {
        q: "How does booking work?",
        a: "Find a tech you want to hire, send a booking request with your project details (dates, role, rate), and the tech accepts or declines. Once accepted, you confirm and payment is secured. After the gig, you mark it complete and the tech gets paid.",
      },
      {
        q: "Are techs on Truss vetted?",
        a: "Techs self-report their skills and experience. Over time, verified reviews from producers, skill endorsements, and completed gigs build a reputation score (New, Verified, Established, Top Rated, Premier). We recommend reviewing a tech's full profile, gear list, and reviews before booking.",
      },
      {
        q: "Can I hire a full crew through Truss?",
        a: "Yes. You can create a project, add multiple roles, and book individual techs for each position. Each booking is a separate transaction, giving you flexibility to mix and match.",
      },
    ],
  },
  {
    heading: "Platform & Security",
    items: [
      {
        q: "Is my data secure?",
        a: "Yes. Truss uses Supabase with row-level security policies on all database tables. Payments are processed through Stripe, which is PCI-DSS compliant. We never store credit card numbers on our servers.",
      },
      {
        q: "Can I delete my account?",
        a: "Yes. Contact support@trusswork.org and we'll remove your account and data. Any completed booking history is retained for financial records as required by law.",
      },
      {
        q: "How do I report a problem?",
        a: "Use the contact form on our Contact page or email support@trusswork.org. For issues with a specific booking, use the report function within the booking or conversation.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <header className="mb-10">
        <p className="text-[11px] font-mono font-semibold tracking-[3px] uppercase text-signal-orange mb-3">
          Support
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-aluminum text-base leading-relaxed max-w-2xl">
          Everything you need to know about using Truss as a technician or producer.
          Can&apos;t find your answer?{" "}
          <Link href="/contact" className="text-signal-orange hover:underline">
            Get in touch
          </Link>.
        </p>
      </header>

      {/* Jump links */}
      <nav className="flex flex-wrap gap-2 mb-10">
        {FAQ_SECTIONS.map((section) => (
          <a
            key={section.heading}
            href={`#${section.heading.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
            className="px-3 py-1.5 border border-ink/[0.1] text-sm text-house-lights/70 hover:text-signal-orange hover:border-signal-orange/30 transition-colors"
          >
            {section.heading}
          </a>
        ))}
      </nav>

      {/* FAQ sections */}
      {FAQ_SECTIONS.map((section) => (
        <section
          key={section.heading}
          id={section.heading.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}
          className="mb-10"
        >
          <h2 className="font-heading text-sm font-bold tracking-[2px] uppercase text-signal-orange mb-4 border-b border-ink/[0.08] pb-2">
            {section.heading}
          </h2>
          <div className="space-y-6">
            {section.items.map((item) => (
              <div key={item.q}>
                <h3 className="font-heading text-base font-bold tracking-tight mb-2">
                  {item.q}
                </h3>
                <p className="text-sm text-house-lights/80 leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <hr className="border-ink/[0.08] mb-10" />

      {/* CTA */}
      <section className="text-center py-10">
        <h2 className="font-heading text-xl font-bold tracking-tight mb-3">
          Still have questions?
        </h2>
        <p className="text-sm text-aluminum mb-6">
          We&apos;re here to help. Reach out and we&apos;ll get back to you within 24 hours.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/contact"
            className="px-6 py-3 bg-signal-orange text-white font-heading font-bold text-sm tracking-[2px] uppercase hover:bg-signal-orange/90 transition-colors"
          >
            Contact Us
          </Link>
          <a
            href="mailto:hello@trusswork.org"
            className="px-6 py-3 border border-signal-orange/30 text-signal-orange font-heading font-bold text-sm tracking-[2px] uppercase hover:bg-signal-orange/10 transition-colors"
          >
            Email Us
          </a>
        </div>
      </section>

      {/* Footer links */}
      <footer className="pt-8 border-t border-ink/[0.08] flex flex-wrap gap-4 text-[11px] font-mono text-aluminum/50">
        <Link href="/about" className="hover:text-signal-orange transition-colors">About</Link>
        <Link href="/rates" className="hover:text-signal-orange transition-colors">Rate Guide</Link>
        <Link href="/learn" className="hover:text-signal-orange transition-colors">Career Guide</Link>
        <Link href="/contact" className="hover:text-signal-orange transition-colors">Contact</Link>
      </footer>
    </main>
  );
}
