import Link from "next/link";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function TechPath({ user, dashboardHref }: { user: any; dashboardHref: string }) {
  const headlineRef = useScrollReveal();
  const topCardsRef = useScrollReveal(0.1);
  const bottomCardsRef = useScrollReveal(0.1);
  const compareHeadRef = useScrollReveal();
  const compareRef = useScrollReveal(0.1);
  const ctaRef = useScrollReveal();

  return (
    <div>
      {/* Headline */}
      <h3 ref={headlineRef.ref} className={`font-heading text-3xl md:text-4xl font-bold tracking-tight text-center mb-12 scroll-reveal ${headlineRef.visible ? "visible" : ""}`}>
        Stop paying 30-50% for a phone call.
      </h3>

      {/* 5 Value Points — 3 top, 2 bottom centered */}
      <div ref={topCardsRef.ref} className={`grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6 stagger-reveal ${topCardsRef.visible ? "visible" : ""}`}>
        <div className="p-6 bg-deep-stage rounded-lg border border-aluminum/20 card-hover">
          <h4 className="font-heading text-lg font-bold text-house-lights mb-3"><span className="text-signal-orange mr-2">1.</span>You own your rate.</h4>
          <p className="text-sm text-aluminum leading-relaxed">
            Set your own hourly rate for every role you work. See what techs like you charge in your city. No more guessing — and no more agency markup you never see.
          </p>
          <Link href="/rates" className="inline-block mt-3 text-sm text-signal-orange hover:underline">
            Browse real rate data by role and city &rarr;
          </Link>
        </div>

        <div className="p-6 bg-deep-stage rounded-lg border border-aluminum/20 card-hover">
          <h4 className="font-heading text-lg font-bold text-house-lights mb-3"><span className="text-signal-orange mr-2">2.</span>You get paid. Period.</h4>
          <p className="text-sm text-aluminum leading-relaxed">
            No more calling a number after your gig. No more submitting invoices and hoping. No more Net 30 that turns into Net 60, Net 90, or Net Never. Payment is processed through Stripe when the booking is confirmed.
          </p>
        </div>

        <div className="p-6 bg-deep-stage rounded-lg border border-aluminum/20 card-hover">
          <h4 className="font-heading text-lg font-bold text-house-lights mb-3"><span className="text-signal-orange mr-2">3.</span>Insurance stops being the reason you need an agency.</h4>
          <p className="text-sm text-aluminum leading-relaxed">
            Producers can add per-event liability insurance right at checkout. You don&apos;t have to buy an annual policy. You don&apos;t have to stay with an agency for coverage. The policy is issued by a licensed insurance company — not the platform.
          </p>
        </div>
      </div>

      <div ref={bottomCardsRef.ref} className={`grid md:grid-cols-2 gap-5 max-w-4xl mx-auto mb-16 stagger-reveal ${bottomCardsRef.visible ? "visible" : ""}`}>
        <div className="p-6 bg-deep-stage rounded-lg border border-aluminum/20 card-hover">
          <h4 className="font-heading text-lg font-bold text-house-lights mb-3"><span className="text-signal-orange mr-2">4.</span>You own your reputation.</h4>
          <p className="text-sm text-aluminum leading-relaxed">
            Every completed gig builds your profile. Reviews, ratings, and verified experience follow YOU — not the agency. Leave tomorrow and your track record comes with you.
          </p>
        </div>

        <div className="p-6 bg-deep-stage rounded-lg border border-aluminum/20 card-hover">
          <h4 className="font-heading text-lg font-bold text-house-lights mb-3"><span className="text-signal-orange mr-2">5.</span>You review them too.</h4>
          <p className="text-sm text-aluminum leading-relaxed">
            After every gig, you rate the producer — was the job as described, was the site safe, were they professional. Bad producers can&apos;t hide behind a brand anymore. Their track record is public.
          </p>
        </div>
      </div>

      {/* Comparison — The Old Way vs Truss */}
      <div className="mb-16">
        <h4 ref={compareHeadRef.ref} className={`font-heading text-xl md:text-2xl font-bold tracking-tight text-center mb-8 scroll-reveal ${compareHeadRef.visible ? "visible" : ""}`}>
          The Old Way vs <span className="text-signal-orange">Truss</span>
        </h4>

        <div ref={compareRef.ref} className={`max-w-4xl mx-auto rounded-lg border border-aluminum/10 overflow-hidden scroll-reveal ${compareRef.visible ? "visible" : ""}`}>
          <div className="grid grid-cols-2 divide-x divide-aluminum/10">
            <div className="p-6 md:p-8">
              <h5 className="font-mono text-xs text-aluminum/50 tracking-wider uppercase mb-5">The Old Way</h5>
              <ul className="space-y-4 text-sm text-aluminum">
                {[
                  "Agency sets your rate. You see a fraction.",
                  "Net 30+. If they pay. Some don't.",
                  "Agency holds insurance over your head.",
                  "Reputation locked to the agency. Leave and it's gone.",
                  "Non-competes keep you trapped.",
                  "You can't review them. They review you.",
                  "No verification — you trust the brand.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-aluminum/30 mt-0.5 flex-shrink-0">&times;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 md:p-8 bg-signal-orange/[0.03]">
              <h5 className="font-mono text-xs text-signal-orange tracking-wider uppercase mb-5">Truss</h5>
              <ul className="space-y-4 text-sm text-house-lights">
                {[
                  "You set your rate. You keep 100% of it.",
                  "Payment secured at booking through Stripe.",
                  "Per-event insurance at checkout. No annual policy needed.",
                  "Your reviews and ratings follow you, not the agency.",
                  "No non-competes. Work with anyone, anywhere.",
                  "You review producers too. Their rating is public.",
                  "Both sides identity-verified through Stripe Identity.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-signal-orange mt-0.5 flex-shrink-0">&#10003;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Tech CTA */}
      <div ref={ctaRef.ref} className={`text-center scroll-reveal ${ctaRef.visible ? "visible" : ""}`}>
        <p className="text-sm text-aluminum">
          No cost. No commitment. No non-compete. Your money. Your reputation. Your career.
        </p>
        <div className="mt-4">
          <Link href="/rates" className="text-sm text-signal-orange hover:underline font-mono">
            Browse the Rate Guide &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
