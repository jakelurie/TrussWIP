"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import RotatingTagline from "@/components/RotatingTagline";
import TechPath from "@/components/splash/TechPath";
import ProducerPath from "@/components/splash/ProducerPath";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCountUp } from "@/hooks/useCountUp";

type Path = "tech" | "producer";

function SplashContent() {
  const searchParams = useSearchParams();
  const initialPath: Path = searchParams.get("path") === "tech" ? "tech" : "producer";

  const [activePath, setActivePath] = useState<Path>(initialPath);
  const [techCount, setTechCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [fading, setFading] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);
    supabase.from("tech_profiles").select("id", { count: "exact", head: true })
      .then(({ count }) => setTechCount(count || 0));
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        supabase.from("profiles").select("user_type").eq("id", session.user.id).single()
          .then(({ data }) => { setUserType(data?.user_type || null); setAuthLoaded(true); });
      } else {
        setAuthLoaded(true);
      }
    });
  }, []);

  // Parallax scroll listener (rAF-throttled)
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dashboardHref = userType === "tech" ? "/dashboard" : userType === "producer" ? "/projects" : "/browse";

  // Scroll-triggered reveals
  const valueRef = useScrollReveal();
  const enterpriseRef = useScrollReveal();
  const entCardsRef = useScrollReveal(0.1);
  const entCompareRef = useScrollReveal(0.1);
  const splitRef = useScrollReveal();
  const splitCardsRef = useScrollReveal(0.1);
  const whyRef = useScrollReveal();

  // Count-up for social proof stats
  const statsRef = useScrollReveal(0.3);
  const animTechCount = useCountUp(techCount, statsRef.visible, 1400);

  const handlePathSelect = (path: Path) => {
    if (path !== activePath) {
      setFading(true);
      setTimeout(() => {
        setActivePath(path);
        setFading(false);
      }, 150);
    }
    document.getElementById("split-path")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Global background layers */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `
          radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,77,0,0.04) 0%, transparent 60%),
          radial-gradient(ellipse 40% 30% at 80% 100%, rgba(255,77,0,0.02) 0%, transparent 50%)
        `,
      }} />

      {/* ===== HERO ===== */}
      <section className="relative min-h-[92vh] flex items-center justify-center">
        {/* Hero-specific background layers (parallax, subtle) */}
        <div className="absolute inset-0 pointer-events-none will-change-transform" style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,77,0,0.07) 0%, transparent 60%)
          `,
          transform: `translateY(${scrollY * 0.15}px)`,
        }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-[0.025] pointer-events-none will-change-transform" style={{
          backgroundImage: "repeating-linear-gradient(45deg, rgba(255,77,0,1) 0px, rgba(255,77,0,1) 1px, transparent 1px, transparent 40px)",
          transform: `translateY(${scrollY * 0.2}px)`,
        }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 pb-20 text-center">
          {/* Headline */}
          <h1 className={`font-heading font-bold tracking-tight mb-6 leading-[0.95] transition-all duration-1000 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <span className="block text-5xl md:text-7xl lg:text-[88px] text-house-lights">THE AV INDUSTRY&apos;S</span>
            <span className="block text-5xl md:text-7xl lg:text-[88px] bg-gradient-to-r from-signal-orange via-amber-400 to-signal-orange bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">OPEN NETWORK.</span>
          </h1>

          {/* Rotating subhead */}
          <div className={`max-w-2xl mx-auto mb-10 transition-all duration-1000 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <RotatingTagline />
          </div>

          {/* CTA buttons */}
          <div className={`flex flex-col sm:flex-row gap-3 justify-center items-center mb-10 transition-all duration-1000 delay-300 ${mounted && authLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <button
              onClick={() => handlePathSelect("tech")}
              className={`px-8 py-3.5 font-heading font-bold text-base tracking-wide rounded-lg transition-all ${
                activePath === "tech"
                  ? "bg-signal-orange text-white shadow-[0_0_24px_rgba(255,77,0,0.15)] ring-2 ring-signal-orange/50"
                  : "bg-transparent text-house-lights border border-aluminum/20 hover:border-signal-orange/40 hover:bg-signal-orange/[0.03]"
              }`}>
              I&apos;m a Technician
            </button>
            <button
              onClick={() => handlePathSelect("producer")}
              className={`px-8 py-3.5 font-heading font-bold text-base tracking-wide rounded-lg transition-all ${
                activePath === "producer"
                  ? "bg-signal-orange text-white shadow-[0_0_24px_rgba(255,77,0,0.15)] ring-2 ring-signal-orange/50"
                  : "bg-transparent text-house-lights border border-aluminum/20 hover:border-signal-orange/40 hover:bg-signal-orange/[0.03]"
              }`}>
              I&apos;m a Producer
            </button>
          </div>

          {/* Social proof */}
          <div ref={statsRef.ref} className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm text-aluminum/50 transition-all duration-1000 delay-400 ${mounted ? "opacity-100" : "opacity-0"}`}>
            {techCount > 0 && <span className="font-mono">{animTechCount}+ techs on the platform</span>}
            <span className="hidden sm:inline">&middot;</span>
            <span className="font-mono">6 departments &middot; 30 roles</span>
            <span className="hidden sm:inline">&middot;</span>
            <span className="font-mono">Free to join</span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-aluminum/35 animate-bounce pointer-events-none">
          <span className="text-xs font-mono tracking-widest">SCROLL</span>
          <span>&darr;</span>
        </div>
      </section>

      {/* ===== CORE VALUE PROP ===== */}
      <section className="py-20 border-t border-ink/[0.06]">
        <div ref={valueRef.ref} className={`max-w-3xl mx-auto px-6 text-center scroll-reveal ${valueRef.visible ? "visible" : ""}`}>
          <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight mb-8">
            The AV staffing model is <span className="text-signal-orange">broken.</span> We&apos;re replacing it.
          </h2>
          <div className="space-y-5 text-aluminum text-base md:text-lg leading-relaxed text-left">
            <p>
              You already know the deal. Agencies take 30-50% of the bill rate. They make you call in after every gig and submit invoices on their timeline. They pay you Net 30 — if they pay you at all. They hold the insurance over your head so you can&apos;t leave. And when something goes wrong — an injury, a dispute, a company that just stops answering the phone — you&apos;re the one left holding the bag.
            </p>
            <p>
              Truss is a different model. You set your rate. You choose your gigs. Payment is secured when the booking is confirmed, not invoiced weeks later through a company you have to trust. And per-event insurance is built into the booking flow, so you don&apos;t need an agency just to be covered.
            </p>
          </div>
        </div>
      </section>

      {/* ===== ENTERPRISE ===== */}
      <section id="enterprise" className="py-20 border-t border-ink/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <div ref={enterpriseRef.ref} className={`text-center mb-14 scroll-reveal ${enterpriseRef.visible ? "visible" : ""}`}>
            <span className="font-mono text-xs text-signal-orange/60 tracking-[4px] uppercase">For Production Companies &amp; Enterprise</span>
            <h2 className="font-heading text-2xl md:text-4xl font-bold tracking-tight mt-3">
              Built for Teams That <span className="text-signal-orange">Scale.</span>
            </h2>
            <p className="text-aluminum text-base md:text-lg max-w-2xl mx-auto mt-4 leading-relaxed">
              Whether you&apos;re staffing one show or a hundred, Truss gives your operations team the billing, crew management, and compliance tools to move fast without the overhead of a staffing agency.
            </p>
          </div>

          {/* Feature grid */}
          <div ref={entCardsRef.ref} className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14 stagger-reveal ${entCardsRef.visible ? "visible" : ""}`}>
            {[
              {
                title: "Flexible Billing",
                desc: "Credit card for one-offs, monthly invoices with PO numbers for ongoing work, or prepaid balance for high-volume teams. Your AP department picks the workflow that fits.",
              },
              {
                title: "Net 15 / Net 30 Terms",
                desc: "Enterprise accounts get consolidated invoicing on net terms. One invoice, one payment — not a stack of freelancer receipts.",
              },
              {
                title: "Crew Sheets & Rosters",
                desc: "Build full crew rosters across multiple days and departments. Export as PDF for production binders or share digitally with your team.",
              },
              {
                title: "Per-Event Insurance",
                desc: "$1M general liability added at checkout for any tech who doesn't carry their own policy. Issued by a licensed insurance partner — not the platform.",
              },
              {
                title: "Identity Verification",
                desc: "Every user on Truss is verified through Stripe Identity — government ID plus selfie match. Know who's showing up to your venue before they badge in.",
              },
              {
                title: "Transparent Pricing",
                desc: "10% platform fee on top of the tech's rate. That's it. No hidden markups, no inflated bill rates, no agency spread you can't see.",
              },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-lg bg-deep-stage border border-aluminum/10 card-hover">
                <h3 className="font-heading font-bold text-house-lights text-base mb-2">{item.title}</h3>
                <p className="text-sm text-aluminum leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Comparison strip */}
          <div ref={entCompareRef.ref} className={`max-w-4xl mx-auto rounded-lg border border-aluminum/10 overflow-hidden mb-14 scroll-reveal ${entCompareRef.visible ? "visible" : ""}`}>
            <div className="grid grid-cols-2 divide-x divide-aluminum/10">
              <div className="p-6 md:p-8">
                <h4 className="font-mono text-xs text-aluminum/50 tracking-wider uppercase mb-4">With a Staffing Agency</h4>
                <ul className="space-y-3 text-sm text-aluminum">
                  {[
                    "30-50% markup hidden in the bill rate",
                    "Agency picks the tech, not you",
                    "No visibility into what the tech actually earns",
                    "Non-competes lock you into the agency",
                    "Insurance controlled by the agency",
                    "Net 60-90 payment to techs creates resentment",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-aluminum/30 mt-0.5 flex-shrink-0">&times;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 md:p-8 bg-signal-orange/[0.03]">
                <h4 className="font-mono text-xs text-signal-orange tracking-wider uppercase mb-4">With Truss</h4>
                <ul className="space-y-3 text-sm text-house-lights">
                  {[
                    "10% platform fee — visible and fixed, no hidden markup",
                    "You browse, vet, and pick your own crew",
                    "The tech's rate is the rate you pay — full transparency",
                    "No non-competes — rebook any tech directly, anytime",
                    "Per-event liability insurance added at checkout",
                    "Payment secured at booking — techs show up motivated",
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
      </section>

      {/* ===== SPLIT PATH ===== */}
      <section id="split-path" className="py-20 border-t border-ink/[0.06]">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section header */}
          <h2 ref={splitRef.ref} className={`font-heading text-2xl md:text-3xl font-bold tracking-tight text-center mb-10 scroll-reveal ${splitRef.visible ? "visible" : ""}`}>
            How Truss Works <span className="text-signal-orange">For You</span>
          </h2>

          {/* Two-column preview cards */}
          <div ref={splitCardsRef.ref} className={`grid md:grid-cols-2 gap-5 mb-14 stagger-reveal ${splitCardsRef.visible ? "visible" : ""}`}>
            <button
              onClick={() => handlePathSelect("tech")}
              className={`text-left p-6 md:p-8 rounded-lg border transition-all card-hover ${
                activePath === "tech"
                  ? "bg-deep-stage border-signal-orange/40 ring-1 ring-signal-orange/20"
                  : "bg-deep-stage/50 border-aluminum/10 hover:border-aluminum/25"
              }`}
            >
              <span className={`font-mono text-xs md:text-sm tracking-[4px] uppercase ${activePath === "tech" ? "text-signal-orange" : "text-aluminum/50"}`}>For Technicians</span>
              <h3 className="font-heading text-xl md:text-2xl font-bold text-house-lights mt-2 mb-3">
                Own your rate. Keep your money. Build your rep.
              </h3>
              <p className="text-sm text-aluminum leading-relaxed mb-4">
                Set your own rate with real market data. Get paid through Stripe when the booking is confirmed. Build a portable reputation that follows you — not your agency.
              </p>
              <span className={`text-sm font-semibold ${activePath === "tech" ? "text-signal-orange" : "text-aluminum/60"}`}>
                {activePath === "tech" ? "Viewing \u2193" : "See how \u2192"}
              </span>
            </button>

            <button
              onClick={() => handlePathSelect("producer")}
              className={`text-left p-6 md:p-8 rounded-lg border transition-all card-hover ${
                activePath === "producer"
                  ? "bg-deep-stage border-signal-orange/40 ring-1 ring-signal-orange/20"
                  : "bg-deep-stage/50 border-aluminum/10 hover:border-aluminum/25"
              }`}
            >
              <span className={`font-mono text-xs md:text-sm tracking-[4px] uppercase ${activePath === "producer" ? "text-signal-orange" : "text-aluminum/50"}`}>For Producers</span>
              <h3 className="font-heading text-xl md:text-2xl font-bold text-house-lights mt-2 mb-3">
                Find verified techs. Book in minutes. Insurance included.
              </h3>
              <p className="text-sm text-aluminum leading-relaxed mb-4">
                Browse by real skills and certifications. See transparent rates. Add per-event liability insurance at checkout. No agency middleman.
              </p>
              <span className={`text-sm font-semibold ${activePath === "producer" ? "text-signal-orange" : "text-aluminum/60"}`}>
                {activePath === "producer" ? "Viewing \u2193" : "See how \u2192"}
              </span>
            </button>
          </div>

          {/* Path content */}
          <div className={`transition-opacity duration-150 ${fading ? "opacity-0" : "opacity-100"}`}>
            {activePath === "tech" ? (
              <TechPath user={user} dashboardHref={dashboardHref} />
            ) : (
              <ProducerPath user={user} dashboardHref={dashboardHref} />
            )}
          </div>
        </div>
      </section>

      {/* ===== WHY WE BUILT THIS ===== */}
      <section className="py-20 border-t border-ink/[0.06] bg-deep-stage/40">
        <div ref={whyRef.ref} className={`max-w-3xl mx-auto px-6 scroll-reveal ${whyRef.visible ? "visible" : ""}`}>
          <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-center mb-10">
            Why We Built This
          </h2>

          <div className="space-y-5 text-aluminum text-base leading-relaxed mb-10">
            <p>
              We&apos;ve been on both sides of the call sheet. We&apos;ve submitted invoices and waited months. We&apos;ve watched friends get hurt on the job and get nothing from the company that sent them there. We&apos;ve seen agencies take 40% for sending an email, and we&apos;ve seen companies shut down overnight while owing hundreds of techs thousands of dollars — then rebrand and do it again.
            </p>
            <p>
              The AV industry runs on talent, trust, and relationships. But the companies between you and the work? They run on opacity. Hidden rates. Locked-in insurance. Payment terms that only protect them.
            </p>
            <p>
              Truss exists because the people doing the work deserve to see the rate, keep the money, and own the reputation. No middleman holding your check. No agency holding your insurance hostage. No company that can disappear with what&apos;s yours.
            </p>
          </div>

          <p className="text-center text-lg md:text-xl text-signal-orange leading-relaxed mb-12">
            This is what it looks like when the industry works for the people in it.
          </p>

          {/* Final CTA */}
          <div className="text-center">
            <Link
              href="/signup"
              className="inline-block px-10 py-3.5 bg-signal-orange text-white font-heading font-bold text-base tracking-wide rounded-lg hover:brightness-110 transition-all"
            >
              Create an Account &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-ink/[0.03] py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="font-mono text-xs text-aluminum/35 tracking-[3px] uppercase mb-3">Platform</div>
              <div className="space-y-2">
                <Link href="/browse" className="block text-sm text-aluminum/60 hover:text-signal-orange transition-colors">Browse Techs</Link>
                <Link href="/signup" className="block text-sm text-aluminum/60 hover:text-signal-orange transition-colors">Sign Up</Link>
                <Link href="/login" className="block text-sm text-aluminum/60 hover:text-signal-orange transition-colors">Log In</Link>
              </div>
            </div>
            <div>
              <div className="font-mono text-xs text-aluminum/35 tracking-[3px] uppercase mb-3">Resources</div>
              <div className="space-y-2">
                <Link href="/rates" className="block text-sm text-aluminum/60 hover:text-signal-orange transition-colors">Rate Guide</Link>
                <Link href="/learn" className="block text-sm text-aluminum/60 hover:text-signal-orange transition-colors">Career Guide</Link>
                <Link href="/tools/day-rate-calculator" className="block text-sm text-aluminum/60 hover:text-signal-orange transition-colors">Day Rate Calculator</Link>
                <Link href="/news" className="block text-sm text-aluminum/60 hover:text-signal-orange transition-colors">News</Link>
              </div>
            </div>
            <div>
              <div className="font-mono text-xs text-aluminum/35 tracking-[3px] uppercase mb-3">Company</div>
              <div className="space-y-2">
                <Link href="/about" className="block text-sm text-aluminum/60 hover:text-signal-orange transition-colors">About</Link>
                <Link href="/contact" className="block text-sm text-aluminum/60 hover:text-signal-orange transition-colors">Contact</Link>
                <Link href="/faq" className="block text-sm text-aluminum/60 hover:text-signal-orange transition-colors">FAQ</Link>
                <Link href="/terms" className="block text-sm text-aluminum/60 hover:text-signal-orange transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="block text-sm text-aluminum/60 hover:text-signal-orange transition-colors">Privacy Policy</Link>
              </div>
            </div>
            <div>
              <div className="font-mono text-xs text-aluminum/35 tracking-[3px] uppercase mb-3">Contact</div>
              <div className="space-y-2">
                <span className="block text-sm text-aluminum/60">hello@trusswork.org</span>
                <span className="block text-sm text-aluminum/60">support@trusswork.org</span>
                <span className="block text-sm text-aluminum/60">San Francisco, CA</span>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-ink/[0.03] flex flex-col sm:flex-row justify-between items-center gap-2">
            <span className="text-xs text-aluminum/35 font-mono">&copy; 2026 Truss. All rights reserved.</span>
            <span className="text-xs text-aluminum/30 font-mono">Built by techs, for techs.</span>
            <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-aluminum/30 font-mono hover:text-aluminum/50 transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" opacity="0.4">
                <path d="M4.709 15.955l4.72-2.756.08-.046 2.698-1.575c.052-.03.052-.107 0-.137L9.51 9.866l-.08-.046-4.8-2.803c-.052-.03-.116.008-.116.069v1.202c0 .046.024.088.064.11l3.36 1.96c.052.03.052.107 0 .137L4.643 12.53a.127.127 0 00-.064.11v3.246c0 .06.064.099.116.069h.014z"/>
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18.5c-4.694 0-8.5-3.806-8.5-8.5S7.306 3.5 12 3.5s8.5 3.806 8.5 8.5-3.806 8.5-8.5 8.5z"/>
              </svg>
              Powered by Claude
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense>
      <SplashContent />
    </Suspense>
  );
}
