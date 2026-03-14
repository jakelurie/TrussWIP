import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Freelance AV Technician Tax Guide 2026 | Truss",
  description:
    "Tax guide for freelance AV technicians — 1099 vs W-2, deductions, quarterly estimated taxes, S-Corp election, and the new No Tax on Overtime provision from the One Big Beautiful Bill Act.",
  keywords: [
    "freelance AV technician taxes",
    "1099 AV tech tax guide",
    "freelance stagehand taxes",
    "self-employment tax AV",
    "AV technician tax deductions",
    "no tax on overtime 2025",
    "one big beautiful bill act overtime",
    "freelance event tech taxes",
    "W-2 vs 1099 AV technician",
    "quarterly estimated taxes freelance",
  ],
  openGraph: {
    title: "Freelance AV Technician Tax Guide 2026 | Truss",
    description:
      "1099 vs W-2, deductions, quarterly payments, and the new overtime tax break. Everything AV techs need to know about taxes.",
    type: "article",
    url: "https://trusswork.org/tax-guide",
  },
};

const DEDUCTIONS = [
  {
    category: "Gear & Equipment",
    items: [
      "Tools and hand tools (wrenches, multimeters, cable testers)",
      "Personal audio/video gear (headphones, hard drives, adapters)",
      "Cases, bags, and cable organizers",
      "PPE (steel-toe boots, hard hats, hearing protection, gloves)",
      "Section 179 deduction or depreciation for large purchases (consoles, speakers, cameras)",
    ],
  },
  {
    category: "Vehicle & Travel",
    items: [
      "Mileage to/from gig sites (standard rate: 70 cents/mile for 2025)",
      "Flights, hotels, and per diem for out-of-town shows",
      "Tolls and parking at venues",
      "Rental vehicles for shows requiring transport",
    ],
  },
  {
    category: "Business Operations",
    items: [
      "Phone and internet (business-use percentage)",
      "Software subscriptions (CAD, Vectorworks, SMAART, QLab)",
      "Industry memberships (IATSE dues, AVIXA, InfoComm)",
      "Continuing education, certifications (CTS, Dante Level 3, rigging certs)",
      "Business insurance (general liability, equipment coverage)",
      "Home office deduction (if applicable)",
    ],
  },
  {
    category: "Marketing & Professional",
    items: [
      "Business cards, website hosting",
      "Trade show attendance (InfoComm, LDI, NAB)",
      "Professional development books and courses",
      "Portfolio and demo reel production costs",
    ],
  },
];

const QUARTERLY_DATES = [
  { period: "Jan 1 – Mar 31", due: "April 15" },
  { period: "Apr 1 – May 31", due: "June 16" },
  { period: "Jun 1 – Aug 31", due: "September 15" },
  { period: "Sep 1 – Dec 31", due: "January 15 (next year)" },
];

export default function TaxGuidePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-2">
        <Link
          href="/resources"
          className="text-[11px] font-mono text-aluminum/40 hover:text-signal-orange transition-colors tracking-wider uppercase"
        >
          &larr; Resources
        </Link>
      </div>
      <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-2">
        FREELANCE AV TECH{" "}
        <span className="text-signal-orange">TAX GUIDE</span>
      </h1>
      <p className="text-sm text-aluminum/60 mb-1">
        2026 Edition &mdash; Updated for the One Big Beautiful Bill Act
      </p>
      <p className="text-xs text-aluminum/40 mb-10">
        Last updated February 2026
      </p>

      {/* ─── 1099 vs W-2 ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          1099 vs W-2: Know Your Classification
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          Most freelance AV technicians work as independent contractors (1099).
          Some work through staffing agencies or production companies as W-2
          employees. The distinction matters because it affects how you pay taxes,
          what you can deduct, and whether the new overtime tax break applies to
          you.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5">
            <h3 className="font-heading text-sm font-bold text-signal-orange tracking-wider uppercase mb-2">
              1099 Independent Contractor
            </h3>
            <ul className="space-y-1.5 text-xs text-aluminum/60">
              <li>&bull; You invoice clients directly</li>
              <li>&bull; No taxes withheld from pay</li>
              <li>&bull; Pay self-employment tax (15.3%)</li>
              <li>&bull; Responsible for quarterly estimated payments</li>
              <li>&bull; Can deduct business expenses</li>
              <li>&bull; Set your own rates, schedule, and methods</li>
            </ul>
          </div>
          <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5">
            <h3 className="font-heading text-sm font-bold text-signal-orange tracking-wider uppercase mb-2">
              W-2 Employee
            </h3>
            <ul className="space-y-1.5 text-xs text-aluminum/60">
              <li>&bull; Paid through a company payroll</li>
              <li>&bull; Taxes withheld from each check</li>
              <li>&bull; Employer pays half of FICA (7.65%)</li>
              <li>&bull; May get benefits (insurance, PTO)</li>
              <li>&bull; Limited deductions (standard deduction)</li>
              <li>&bull; Eligible for overtime pay under FLSA</li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-aluminum/50 leading-relaxed">
          Some techs are both — 1099 for their own freelance gigs and W-2 through
          a staffing agency. If that&apos;s you, keep separate records for each.
          Your 1099 income goes on Schedule C; your W-2 income is reported on your
          W-2 form.
        </p>
      </section>

      {/* ─── Self-Employment Tax ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Self-Employment Tax (1099 Only)
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          As a 1099 contractor, you pay both the employer and employee share of
          Social Security and Medicare. This is the self-employment tax.
        </p>
        <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-heading text-2xl font-bold text-signal-orange">
                12.4%
              </div>
              <div className="text-[10px] font-mono text-aluminum/50 mt-1">
                Social Security
              </div>
              <div className="text-[10px] text-aluminum/40">
                (on first $176,100)
              </div>
            </div>
            <div>
              <div className="font-heading text-2xl font-bold text-signal-orange">
                2.9%
              </div>
              <div className="text-[10px] font-mono text-aluminum/50 mt-1">
                Medicare
              </div>
              <div className="text-[10px] text-aluminum/40">
                (no income cap)
              </div>
            </div>
            <div>
              <div className="font-heading text-2xl font-bold text-signal-orange">
                15.3%
              </div>
              <div className="text-[10px] font-mono text-aluminum/50 mt-1">
                Total SE Tax
              </div>
              <div className="text-[10px] text-aluminum/40">
                (on 92.35% of net)
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-aluminum/50 leading-relaxed">
          You can deduct the employer-equivalent half (7.65%) of your
          self-employment tax from your adjusted gross income. This is an
          above-the-line deduction — you get it even if you take the standard
          deduction.
        </p>
      </section>

      {/* ─── Quarterly Estimated Taxes ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Quarterly Estimated Payments
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          If you expect to owe $1,000+ in taxes for the year, the IRS requires
          quarterly estimated payments. Miss them and you&apos;ll owe penalties.
        </p>
        <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl overflow-hidden">
          <div className="grid grid-cols-2 gap-px bg-ink/[0.03]">
            <div className="bg-deep-stage/60 p-3 text-xs font-mono text-aluminum/60 font-bold">
              Income Period
            </div>
            <div className="bg-deep-stage/60 p-3 text-xs font-mono text-aluminum/60 font-bold">
              Payment Due
            </div>
            {QUARTERLY_DATES.map((q) => (
              <>
                <div
                  key={q.period}
                  className="bg-deep-stage/40 p-3 text-xs text-aluminum/60"
                >
                  {q.period}
                </div>
                <div
                  key={q.due}
                  className="bg-deep-stage/40 p-3 text-xs text-house-lights/80 font-mono"
                >
                  {q.due}
                </div>
              </>
            ))}
          </div>
        </div>
        <p className="text-xs text-aluminum/50 leading-relaxed mt-3">
          Use IRS Form 1040-ES to calculate and submit payments. A common
          shortcut: set aside 25-30% of every check in a separate savings account
          and pay from there each quarter.
        </p>
      </section>

      {/* ─── Deductions ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Common Deductions for AV Techs
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          If you&apos;re 1099, every legitimate business expense reduces your
          taxable income. Track everything — receipts, mileage logs, invoices.
        </p>
        <div className="space-y-4">
          {DEDUCTIONS.map((cat) => (
            <div
              key={cat.category}
              className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5"
            >
              <h3 className="font-heading text-sm font-bold text-signal-orange tracking-wider uppercase mb-3">
                {cat.category}
              </h3>
              <ul className="space-y-1.5">
                {cat.items.map((item) => (
                  <li
                    key={item}
                    className="text-xs text-aluminum/60 leading-relaxed flex gap-2"
                  >
                    <span className="text-signal-orange/50 shrink-0">
                      &bull;
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ─── No Tax on Overtime ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          No Tax on Overtime{" "}
          <span className="text-xs font-mono text-aluminum/40 normal-case tracking-normal">
            One Big Beautiful Bill Act (2025)
          </span>
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          Signed into law July 4, 2025, this provision lets qualifying workers
          deduct the overtime premium portion of their overtime pay from federal
          taxable income. Here&apos;s what AV techs need to know.
        </p>

        <div className="bg-signal-orange/[0.04] border border-signal-orange/15 rounded-xl p-5 mb-4">
          <h3 className="font-heading text-sm font-bold tracking-wider uppercase mb-3">
            How It Works
          </h3>
          <ul className="space-y-2 text-xs text-aluminum/70 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-signal-orange shrink-0 font-bold">1.</span>
              Applies only to FLSA overtime — hours worked beyond 40 in a
              single workweek. Does not apply to California daily overtime
              (after 8 hours).
            </li>
            <li className="flex gap-2">
              <span className="text-signal-orange shrink-0 font-bold">2.</span>
              Only the &ldquo;half&rdquo; of time-and-a-half is deductible, not the
              full overtime pay. If your base rate is $40/hr, your OT rate is
              $60/hr. The $20 premium is deductible; the base $40 is not.
            </li>
            <li className="flex gap-2">
              <span className="text-signal-orange shrink-0 font-bold">3.</span>
              Deduction is capped at $12,500/year for single filers and
              $25,000 for married filing jointly.
            </li>
            <li className="flex gap-2">
              <span className="text-signal-orange shrink-0 font-bold">4.</span>
              Your total income must be under $125,000 to qualify (phases out
              above that).
            </li>
            <li className="flex gap-2">
              <span className="text-signal-orange shrink-0 font-bold">5.</span>
              Federal deduction only. States set their own rules — California
              is not adopting this provision.
            </li>
          </ul>
        </div>

        <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5 mb-4">
          <h3 className="font-heading text-sm font-bold tracking-wider uppercase mb-3">
            Does This Apply to Me?
          </h3>
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <span className="text-xs font-mono text-signal-orange font-bold bg-signal-orange/[0.08] px-2 py-0.5 rounded shrink-0">
                W-2
              </span>
              <p className="text-xs text-aluminum/70 leading-relaxed">
                <strong className="text-house-lights/80">
                  Yes, if you work through a staffing agency or production company
                  as a W-2 employee.
                </strong>{" "}
                Many AV staffing companies (PSAV/Encore, Freeman, etc.) pay
                hourly W-2 techs with overtime after 40 hours/week. If you earn
                OT through these companies, the premium portion is deductible.
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-xs font-mono text-aluminum/50 font-bold bg-aluminum/[0.08] px-2 py-0.5 rounded shrink-0">
                1099
              </span>
              <p className="text-xs text-aluminum/70 leading-relaxed">
                <strong className="text-house-lights/80">
                  No, this does not apply to most freelance 1099 AV techs.
                </strong>{" "}
                Independent contractors set their own rates and aren&apos;t
                covered by FLSA overtime rules. You don&apos;t earn
                &ldquo;overtime&rdquo; — you bill a flat day rate or hourly rate
                regardless of hours worked. Some 1099 contracts include an OT
                clause, but that&apos;s a contractual agreement, not FLSA
                overtime, and doesn&apos;t qualify.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5">
          <h3 className="font-heading text-sm font-bold tracking-wider uppercase mb-2">
            Example
          </h3>
          <p className="text-xs text-aluminum/60 leading-relaxed mb-3">
            You work 50 hours in a week as a W-2 stagehand at $30/hr through a
            staffing agency:
          </p>
          <div className="font-mono text-xs space-y-1 text-aluminum/60">
            <div>
              40 hrs x $30 ={" "}
              <span className="text-house-lights/80">$1,200</span>{" "}
              <span className="text-aluminum/40">(regular pay)</span>
            </div>
            <div>
              10 hrs x $45 ={" "}
              <span className="text-house-lights/80">$450</span>{" "}
              <span className="text-aluminum/40">
                (OT at time-and-a-half)
              </span>
            </div>
            <div>
              10 hrs x $15 ={" "}
              <span className="text-signal-orange">$150</span>{" "}
              <span className="text-aluminum/40">
                (deductible OT premium)
              </span>
            </div>
          </div>
          <p className="text-[11px] text-aluminum/50 mt-3">
            Over a year of busy show seasons, that could add up to a meaningful
            deduction — but only for the premium portion, and only up to the
            $12,500 cap.
          </p>
        </div>
      </section>

      {/* ─── S-Corp Election ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          S-Corp Election
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          If your net 1099 income consistently exceeds $80,000-$100,000/year,
          forming an LLC and electing S-Corp tax status can save thousands in
          self-employment tax. Here&apos;s the concept.
        </p>
        <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5">
          <ul className="space-y-2 text-xs text-aluminum/60 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-signal-orange/50 shrink-0">&bull;</span>
              You form an LLC and elect S-Corp taxation with the IRS (Form
              2553).
            </li>
            <li className="flex gap-2">
              <span className="text-signal-orange/50 shrink-0">&bull;</span>
              You pay yourself a &ldquo;reasonable salary&rdquo; — say $70,000 —
              and pay FICA (15.3%) on that amount.
            </li>
            <li className="flex gap-2">
              <span className="text-signal-orange/50 shrink-0">&bull;</span>
              The remaining profit is distributed as a dividend, which is not
              subject to self-employment tax.
            </li>
            <li className="flex gap-2">
              <span className="text-signal-orange/50 shrink-0">&bull;</span>
              On $120,000 net income: as a sole proprietor, you&apos;d pay SE
              tax on the full $120K. As an S-Corp paying yourself $70K
              salary, you only pay FICA on $70K — saving roughly $7,650/year.
            </li>
            <li className="flex gap-2">
              <span className="text-signal-orange/50 shrink-0">&bull;</span>
              Costs: LLC formation ($100-$800 depending on state), annual
              payroll processing (~$500-$1,200/yr), and a CPA who knows
              S-Corps ($1,000-$2,000/yr for tax prep).
            </li>
          </ul>
          <p className="text-[11px] text-aluminum/40 mt-3">
            The math usually makes sense above $80K net. Below that, the
            administrative costs may outweigh the savings. Talk to a CPA
            before making this election.
          </p>
        </div>
      </section>

      {/* ─── Record Keeping ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Record Keeping
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          The IRS can audit you for up to 3 years (6 if they suspect
          underreporting). Keep clean records.
        </p>
        <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5">
          <ul className="space-y-2 text-xs text-aluminum/60 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-signal-orange/50 shrink-0">&bull;</span>
              Separate business bank account — do not mix personal and
              business transactions.
            </li>
            <li className="flex gap-2">
              <span className="text-signal-orange/50 shrink-0">&bull;</span>
              Track mileage per gig (apps: MileIQ, Everlance, or a
              spreadsheet).
            </li>
            <li className="flex gap-2">
              <span className="text-signal-orange/50 shrink-0">&bull;</span>
              Save all receipts for gear purchases, travel, and business
              expenses.
            </li>
            <li className="flex gap-2">
              <span className="text-signal-orange/50 shrink-0">&bull;</span>
              Keep copies of all 1099-NEC forms you receive from clients.
            </li>
            <li className="flex gap-2">
              <span className="text-signal-orange/50 shrink-0">&bull;</span>
              Use accounting software (QuickBooks Self-Employed, Wave, or
              FreshBooks) to categorize income and expenses throughout the
              year.
            </li>
          </ul>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="text-center py-10 border-t border-ink/[0.03]">
        <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight mb-3">
          Know Your Worth on{" "}
          <span className="text-signal-orange">Truss</span>
        </h2>
        <p className="text-sm text-aluminum/60 mb-6 max-w-md mx-auto">
          See what techs in your role and market are charging. Set your rates,
          build your profile, and get booked.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/rates"
            className="px-6 py-3 bg-signal-orange text-white font-heading font-bold text-xs tracking-[3px] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(255,77,0,0.25)] transition-all"
          >
            View Rate Guide
          </Link>
          <Link
            href="/tools/day-rate-calculator"
            className="px-6 py-3 border border-signal-orange/30 text-signal-orange font-heading font-bold text-xs tracking-[3px] uppercase rounded-xl hover:bg-signal-orange/[0.06] transition-all"
          >
            Day Rate Calculator
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="mt-8 pt-6 border-t border-ink/[0.03]">
        <p className="text-[10px] text-aluminum/30 leading-relaxed max-w-2xl">
          This guide is for informational purposes only and does not constitute
          tax, legal, or financial advice. Tax laws change frequently and
          individual situations vary. Consult a qualified tax professional or CPA
          for advice specific to your situation. Truss is not a tax preparation
          service and does not guarantee the accuracy of this information.
        </p>
      </div>
    </main>
  );
}
