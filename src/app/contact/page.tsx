import Link from "next/link";
import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact | Truss",
  description:
    "Get in touch with the Truss team. Questions about the platform, partnerships, or press — we'd like to hear from you.",
  openGraph: {
    title: "Contact | Truss",
    description: "Get in touch with the Truss team.",
    url: "https://trusswork.org/contact",
  },
};

export default function ContactPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <header className="mb-10">
        <p className="text-[11px] font-mono font-semibold tracking-[3px] uppercase text-signal-orange mb-3">
          Contact
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">
          Get in Touch
        </h1>
        <p className="text-aluminum text-base leading-relaxed max-w-2xl">
          Questions about the platform, partnerships, or press? Reach out and
          we&apos;ll get back to you.
        </p>
      </header>

      <hr className="border-ink/[0.08] mb-10" />

      <div className="grid sm:grid-cols-2 gap-8 mb-10">
        {/* Contact info */}
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-sm font-bold tracking-[2px] uppercase text-aluminum mb-2">
              Email
            </h2>
            <a
              href="mailto:hello@trusswork.org"
              className="text-signal-orange hover:underline text-sm"
            >
              hello@trusswork.org
            </a>
            <p className="text-[11px] text-aluminum/50 mt-1">
              We typically respond within 24 hours.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-sm font-bold tracking-[2px] uppercase text-aluminum mb-2">
              Location
            </h2>
            <p className="text-sm text-house-lights/80">San Francisco, CA</p>
          </div>

          <div>
            <h2 className="font-heading text-sm font-bold tracking-[2px] uppercase text-aluminum mb-2">
              For Specific Questions
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-house-lights/80">
                <span className="text-aluminum/60">Account issues:</span>{" "}
                <a href="mailto:support@trusswork.org" className="text-signal-orange hover:underline">
                  support@trusswork.org
                </a>
              </p>
              <p className="text-house-lights/80">
                <span className="text-aluminum/60">Press &amp; media:</span>{" "}
                <a href="mailto:press@trusswork.org" className="text-signal-orange hover:underline">
                  press@trusswork.org
                </a>
              </p>
              <p className="text-house-lights/80">
                <span className="text-aluminum/60">Partnerships:</span>{" "}
                <a href="mailto:partners@trusswork.org" className="text-signal-orange hover:underline">
                  partners@trusswork.org
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div>
          <h2 className="font-heading text-sm font-bold tracking-[2px] uppercase text-aluminum mb-4">
            Send a Message
          </h2>
          <ContactForm />
        </div>
      </div>

      <hr className="border-ink/[0.08] mb-10" />

      {/* Quick links */}
      <section className="mb-10">
        <h2 className="font-heading text-sm font-bold tracking-[2px] uppercase text-aluminum mb-3">
          You Might Also Be Looking For
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "FAQ", href: "/faq" },
            { label: "Rate Guide", href: "/rates" },
            { label: "Sign Up", href: "/signup" },
            { label: "About", href: "/about" },
            { label: "Terms of Service", href: "/terms" },
            { label: "Privacy Policy", href: "/privacy" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 border border-ink/[0.1] text-sm text-house-lights/70 hover:text-signal-orange hover:border-signal-orange/30 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
