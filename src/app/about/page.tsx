import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Truss",
  description:
    "Truss is the marketplace built for corporate AV technicians and event producers. Direct booking, transparent rates, no agency markup.",
  openGraph: {
    title: "About | Truss",
    description:
      "The marketplace built for corporate AV technicians and event producers.",
    url: "https://trusswork.org/about",
  },
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <header className="mb-12">
        <p className="text-[11px] font-mono font-semibold tracking-[3px] uppercase text-signal-orange mb-3">
          About
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">
          The Backbone of Every Show
        </h1>
        <p className="text-aluminum text-base leading-relaxed max-w-2xl">
          Truss is a marketplace that connects freelance AV technicians with the
          producers who need them. Direct booking, transparent rates, no agency
          in the middle.
        </p>
      </header>

      <hr className="border-ink/[0.08] mb-10" />

      {/* Why */}
      <section className="mb-10">
        <h2 className="font-heading text-xl font-bold tracking-tight mb-4">
          Why Truss Exists
        </h2>
        <div className="space-y-4 text-sm text-house-lights/85 leading-relaxed">
          <p>
            The corporate AV industry runs on relationships and phone calls. Producers
            keep a mental list of techs they trust, and techs hustle to stay on those
            lists. When someone falls off — or when a producer needs a specialist in
            an unfamiliar city — the whole system breaks down into frantic group texts
            and last-minute scrambles.
          </p>
          <p>
            Agencies stepped in to solve this, but they added overhead, took a cut of
            the tech's rate, and locked talent behind non-competes. The tech became a
            line item instead of a professional.
          </p>
          <p>
            Truss removes the middleman. Techs set their own rates, own their profiles,
            and build reputations that follow them — not locked inside an agency's
            database. Producers search by role, city, availability, and rate. They see
            real skills, real gear lists, real reviews. They book directly.
          </p>
        </div>
      </section>

      <hr className="border-ink/[0.08] mb-10" />

      {/* What we believe */}
      <section className="mb-10">
        <h2 className="font-heading text-xl font-bold tracking-tight mb-4">
          What We Believe
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              heading: "Techs are professionals",
              body: "Not interchangeable labor. An A1 with 15 years of DiGiCo experience is not the same as an A1 who just graduated. Profiles should reflect that.",
            },
            {
              heading: "Rates should be transparent",
              body: "No hidden markups. No agency padding. What a producer pays and what a tech earns should be visible to both sides.",
            },
            {
              heading: "Reputation is portable",
              body: "Your reviews, skills, and track record belong to you. Not to an agency. Not to a staffing company. To you.",
            },
            {
              heading: "The industry deserves better tools",
              body: "Rate calculators, RF coordination tools, contract templates, gear databases — built for AV, not adapted from generic freelance platforms.",
            },
          ].map((item) => (
            <div
              key={item.heading}
              className="bg-deep-stage border border-ink/[0.1] p-5"
            >
              <h3 className="font-heading text-sm font-bold tracking-wider uppercase mb-2">
                {item.heading}
              </h3>
              <p className="text-xs text-aluminum leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-ink/[0.08] mb-10" />

      {/* Built in SF */}
      <section className="mb-10">
        <h2 className="font-heading text-xl font-bold tracking-tight mb-4">
          Built in San Francisco
        </h2>
        <div className="space-y-4 text-sm text-house-lights/85 leading-relaxed">
          <p>
            Truss is built by people who have loaded trucks, patched snakes, and
            troubleshot ground loops at 2 AM. The platform exists because we lived the
            problems it solves.
          </p>
          <p>
            We're based in San Francisco and focused exclusively on the corporate and
            live event AV market. We're not trying to be a platform for every kind of
            freelancer — we're building the best tool for this industry specifically.
          </p>
        </div>
      </section>

      <hr className="border-ink/[0.08] mb-10" />

      {/* Numbers */}
      <section className="mb-10">
        <h2 className="font-heading text-sm font-bold tracking-[2px] uppercase text-aluminum mb-4">
          The Platform
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { stat: "21", label: "Crew Roles" },
            { stat: "15", label: "Markets" },
            { stat: "700+", label: "SEO Pages" },
            { stat: "Free", label: "For Techs" },
          ].map((item) => (
            <div key={item.label}>
              <div className="font-mono text-2xl font-bold text-signal-orange">
                {item.stat}
              </div>
              <div className="text-[11px] text-aluminum/60 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-ink/[0.08] mb-10" />

      {/* CTA */}
      <section className="text-center py-10">
        <h2 className="font-heading text-xl font-bold tracking-tight mb-3">
          Join the Marketplace
        </h2>
        <p className="text-sm text-aluminum mb-6 max-w-md mx-auto">
          Whether you're a tech looking for gigs or a producer building a crew,
          Truss is free to get started.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup?type=tech"
            className="px-6 py-3 bg-signal-orange text-white font-heading font-bold text-sm tracking-[2px] uppercase hover:bg-signal-orange/90 transition-colors"
          >
            Create a Tech Profile
          </Link>
          <Link
            href="/signup?type=producer"
            className="px-6 py-3 border border-signal-orange/30 text-signal-orange font-heading font-bold text-sm tracking-[2px] uppercase hover:bg-signal-orange/10 transition-colors"
          >
            Producer Account
          </Link>
        </div>
      </section>

      {/* Footer links */}
      <footer className="pt-8 border-t border-ink/[0.08] flex flex-wrap gap-4 text-[11px] font-mono text-aluminum/50">
        <Link href="/rates" className="hover:text-signal-orange transition-colors">Rate Guide</Link>
        <Link href="/learn" className="hover:text-signal-orange transition-colors">Career Guide</Link>
        <Link href="/contact" className="hover:text-signal-orange transition-colors">Contact</Link>
        <Link href="/faq" className="hover:text-signal-orange transition-colors">FAQ</Link>
      </footer>
    </main>
  );
}
