import Link from "next/link";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function ProducerPath({ user, dashboardHref }: { user: any; dashboardHref: string }) {
  const headlineRef = useScrollReveal();
  const cardsRef = useScrollReveal(0.1);
  const stepperHeadRef = useScrollReveal();
  const stepperRef = useScrollReveal(0.1);
  const ctaRef = useScrollReveal();

  return (
    <div>
      {/* Headline */}
      <h3 ref={headlineRef.ref} className={`font-heading text-3xl md:text-4xl font-bold tracking-tight text-center mb-12 scroll-reveal ${headlineRef.visible ? "visible" : ""}`}>
        Find verified AV techs. Book them in minutes.<br className="hidden md:block" />
        <span className="text-signal-orange"> Insurance included.</span>
      </h3>

      {/* 3 Value Points */}
      <div ref={cardsRef.ref} className={`grid md:grid-cols-3 gap-5 mb-16 stagger-reveal ${cardsRef.visible ? "visible" : ""}`}>
        <div className="p-6 bg-deep-stage rounded-lg border border-aluminum/20 card-hover">
          <h4 className="font-heading text-lg font-bold text-house-lights mb-3"><span className="text-signal-orange mr-2">1.</span>Browse by the skills that actually matter.</h4>
          <p className="text-sm text-aluminum leading-relaxed">
            Our industry taxonomy covers 6 departments, 24 roles, and 100+ specializations. Search for &ldquo;A1 with Dante certification and Yamaha CL experience in San Diego&rdquo; — not just &ldquo;audio technician.&rdquo;
          </p>
        </div>

        <div className="p-6 bg-deep-stage rounded-lg border border-aluminum/20 card-hover">
          <h4 className="font-heading text-lg font-bold text-house-lights mb-3"><span className="text-signal-orange mr-2">2.</span>Know what you&apos;re getting before they show up.</h4>
          <p className="text-sm text-aluminum leading-relaxed">
            Every tech has a profile with verified skills, gear proficiencies, reviews from past producers, and transparent rates. Every user on Truss is identity-verified through Stripe Identity — government ID plus selfie match.
          </p>
        </div>

        <div className="p-6 bg-deep-stage rounded-lg border border-aluminum/20 card-hover">
          <h4 className="font-heading text-lg font-bold text-house-lights mb-3"><span className="text-signal-orange mr-2">3.</span>Insurance handled at checkout.</h4>
          <p className="text-sm text-aluminum leading-relaxed">
            Booking a tech who doesn&apos;t carry their own GL policy? Add per-event liability coverage with one click. $1M general liability, provided by a licensed insurance partner, added to your booking total.
          </p>
        </div>
      </div>

      {/* How Booking Works */}
      <div className="mb-8">
        <h4 ref={stepperHeadRef.ref} className={`font-heading text-xl md:text-2xl font-bold tracking-tight text-center mb-10 scroll-reveal ${stepperHeadRef.visible ? "visible" : ""}`}>
          How Booking Works
        </h4>

        {/* Desktop: horizontal stepper */}
        <div ref={stepperRef.ref} className={`hidden md:flex items-start justify-between gap-4 stagger-reveal ${stepperRef.visible ? "visible" : ""}`}>
          {[
            { step: "1", title: "Search", desc: "Search by role, city, availability, and rate." },
            { step: "2", title: "Review", desc: "Review profiles — skills, gear, reviews, portfolio." },
            { step: "3", title: "Request", desc: "Send a booking request with your project details." },
            { step: "4", title: "Insure", desc: "If the tech isn't insured, add event coverage at checkout." },
            { step: "5", title: "Confirm", desc: "Tech accepts. You confirm. Payment secured. Done." },
          ].map((item, i) => (
            <div key={i} className="flex-1 text-center">
              <div className="relative flex items-center justify-center mb-4">
                {i > 0 && <div className="absolute right-1/2 top-1/2 -translate-y-1/2 w-full h-px bg-aluminum/20 -z-10" />}
                <div className="w-10 h-10 rounded-full bg-signal-orange flex items-center justify-center font-heading font-bold text-white text-sm relative z-10">
                  {item.step}
                </div>
              </div>
              <h5 className="font-heading font-bold text-house-lights text-sm mb-1">{item.title}</h5>
              <p className="text-sm text-aluminum leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Mobile: vertical stepper */}
        <div className="md:hidden space-y-6">
          {[
            { step: "1", title: "Search", desc: "Search by role, city, availability, and rate." },
            { step: "2", title: "Review", desc: "Review profiles — skills, gear, reviews, portfolio." },
            { step: "3", title: "Request", desc: "Send a booking request with your project details." },
            { step: "4", title: "Insure", desc: "If the tech isn't insured, add event coverage at checkout." },
            { step: "5", title: "Confirm", desc: "Tech accepts. You confirm. Payment secured. Done." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-signal-orange flex items-center justify-center font-heading font-bold text-white text-sm flex-shrink-0">
                  {item.step}
                </div>
                {i < 4 && <div className="w-px h-6 bg-aluminum/20 mt-2" />}
              </div>
              <div className="pt-1">
                <h5 className="font-heading font-bold text-house-lights text-sm">{item.title}</h5>
                <p className="text-sm text-aluminum leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enterprise teaser */}
      <div className="mb-6 text-center">
        <p className="text-sm text-aluminum">
          Running a production company or managing multiple events?{" "}
          <a href="#enterprise" className="text-signal-orange hover:underline">See enterprise features &darr;</a>
        </p>
      </div>
    </div>
  );
}
