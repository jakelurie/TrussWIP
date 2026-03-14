"use client";

import { useState } from "react";
import Link from "next/link";

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export default function DayRateCalculator() {
  const [income, setIncome] = useState(80000);
  const [workingDays, setWorkingDays] = useState(200);
  const [healthInsurance, setHealthInsurance] = useState(500);
  const [gearCosts, setGearCosts] = useState(200);
  const [slowMonths, setSlowMonths] = useState(2);

  // ─── Math ────────────────────────────────────────────────────
  const SE_TAX_RATE = 0.153;

  const annualHealthInsurance = healthInsurance * 12;
  const annualGearCosts = gearCosts * 12;
  const totalExpenses = annualHealthInsurance + annualGearCosts;

  // Gross needed: (income + expenses) / (1 - SE tax rate)
  const grossNeeded = (income + totalExpenses) / (1 - SE_TAX_RATE);
  const seTaxAmount = grossNeeded * SE_TAX_RATE;

  // Effective working days after slow months
  const effectiveDays = Math.round(workingDays * ((12 - slowMonths) / 12));
  const dayRate = effectiveDays > 0 ? grossNeeded / effectiveDays : 0;
  const hourlyRate = dayRate / 10; // 10-hour day standard in AV

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="font-mono text-[10px] text-signal-orange/50 tracking-[4px] uppercase">
          Tools
        </span>
        <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mt-2">
          DAY RATE <span className="text-signal-orange">CALCULATOR</span>
        </h1>
        <p className="text-sm text-aluminum/65 mt-3 max-w-xl mx-auto">
          Figure out what you actually need to charge per day as a freelance AV
          technician. This calculator factors in taxes, insurance, gear, and the
          months you won&apos;t be working.
        </p>
      </div>

      {/* ===== INPUTS ===== */}
      <section className="space-y-6 mb-12">
        {/* Target Annual Income */}
        <div className="p-5 rounded-xl bg-deep-stage/40 border border-ink/[0.05]">
          <div className="flex items-center justify-between mb-3">
            <label className="font-heading text-sm font-bold tracking-wider uppercase">
              Target Take-Home Income
            </label>
            <div className="flex items-center gap-1">
              <span className="text-xs text-aluminum/60 font-mono">$</span>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(Number(e.target.value) || 0)}
                className="w-28 bg-blackout/60 border border-white/10 rounded px-2 py-1 text-right text-sm font-mono text-house-lights focus:outline-none focus:border-signal-orange/40"
              />
            </div>
          </div>
          <input
            type="range"
            min={30000}
            max={250000}
            step={5000}
            value={income}
            onChange={(e) => setIncome(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] font-mono text-aluminum/50 mt-1">
            <span>$30k</span>
            <span>$250k</span>
          </div>
        </div>

        {/* Working Days */}
        <div className="p-5 rounded-xl bg-deep-stage/40 border border-ink/[0.05]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="font-heading text-sm font-bold tracking-wider uppercase">
                Working Days / Year
              </label>
              <p className="text-[11px] text-aluminum/50 mt-0.5">
                Before accounting for slow months
              </p>
            </div>
            <span className="text-lg font-heading font-bold text-signal-orange">
              {workingDays}
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={260}
            step={5}
            value={workingDays}
            onChange={(e) => setWorkingDays(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] font-mono text-aluminum/50 mt-1">
            <span>100 days</span>
            <span>260 days</span>
          </div>
        </div>

        {/* Slow Months */}
        <div className="p-5 rounded-xl bg-deep-stage/40 border border-ink/[0.05]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="font-heading text-sm font-bold tracking-wider uppercase">
                Slow Months
              </label>
              <p className="text-[11px] text-aluminum/50 mt-0.5">
                Months with little or no work (summer, holidays, etc.)
              </p>
            </div>
            <span className="text-lg font-heading font-bold text-signal-orange">
              {slowMonths}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={5}
            step={1}
            value={slowMonths}
            onChange={(e) => setSlowMonths(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] font-mono text-aluminum/50 mt-1">
            <span>0 months</span>
            <span>5 months</span>
          </div>
        </div>

        {/* Health Insurance */}
        <div className="p-5 rounded-xl bg-deep-stage/40 border border-ink/[0.05]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="font-heading text-sm font-bold tracking-wider uppercase">
                Health Insurance
              </label>
              <p className="text-[11px] text-aluminum/50 mt-0.5">
                Monthly premium (marketplace average for individuals)
              </p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-aluminum/60 font-mono">$</span>
              <input
                type="number"
                value={healthInsurance}
                onChange={(e) =>
                  setHealthInsurance(Number(e.target.value) || 0)
                }
                className="w-20 bg-blackout/60 border border-white/10 rounded px-2 py-1 text-right text-sm font-mono text-house-lights focus:outline-none focus:border-signal-orange/40"
              />
              <span className="text-xs text-aluminum/60 font-mono">/mo</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={1500}
            step={50}
            value={healthInsurance}
            onChange={(e) => setHealthInsurance(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] font-mono text-aluminum/50 mt-1">
            <span>$0</span>
            <span>$1,500/mo</span>
          </div>
        </div>

        {/* Gear Costs */}
        <div className="p-5 rounded-xl bg-deep-stage/40 border border-ink/[0.05]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="font-heading text-sm font-bold tracking-wider uppercase">
                Gear & Equipment
              </label>
              <p className="text-[11px] text-aluminum/50 mt-0.5">
                Tools, software, maintenance, amortized purchases
              </p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-aluminum/60 font-mono">$</span>
              <input
                type="number"
                value={gearCosts}
                onChange={(e) => setGearCosts(Number(e.target.value) || 0)}
                className="w-20 bg-blackout/60 border border-white/10 rounded px-2 py-1 text-right text-sm font-mono text-house-lights focus:outline-none focus:border-signal-orange/40"
              />
              <span className="text-xs text-aluminum/60 font-mono">/mo</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={1000}
            step={25}
            value={gearCosts}
            onChange={(e) => setGearCosts(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] font-mono text-aluminum/50 mt-1">
            <span>$0</span>
            <span>$1,000/mo</span>
          </div>
        </div>
      </section>

      {/* ===== RESULTS ===== */}
      <section className="mb-12">
        <div className="p-6 rounded-xl bg-deep-stage border border-signal-orange/20">
          <div className="text-center mb-6">
            <div className="font-mono text-[10px] text-signal-orange/50 tracking-[4px] uppercase mb-2">
              Your Day Rate
            </div>
            <div className="font-heading text-5xl md:text-6xl font-bold text-signal-orange">
              {fmt(dayRate)}
            </div>
            <div className="text-sm text-aluminum/60 mt-1">
              per 10-hour day · {fmt(hourlyRate)}/hr
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-blackout/40 text-center">
              <div className="text-[9px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">
                Gross Needed
              </div>
              <div className="font-heading text-base font-bold text-house-lights">
                {fmt(grossNeeded)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blackout/40 text-center">
              <div className="text-[9px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">
                SE Tax (15.3%)
              </div>
              <div className="font-heading text-base font-bold text-house-lights">
                {fmt(seTaxAmount)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blackout/40 text-center">
              <div className="text-[9px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">
                Annual Expenses
              </div>
              <div className="font-heading text-base font-bold text-house-lights">
                {fmt(totalExpenses)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blackout/40 text-center">
              <div className="text-[9px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">
                Billable Days
              </div>
              <div className="font-heading text-base font-bold text-house-lights">
                {effectiveDays}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SHOW THE MATH ===== */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-6">
          The Math
        </h2>
        <div className="p-5 rounded-xl bg-deep-stage/40 border border-ink/[0.05] font-mono text-sm space-y-3">
          <div className="flex justify-between">
            <span className="text-aluminum/65">Target take-home income</span>
            <span className="text-house-lights">{fmt(income)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-aluminum/65">
              + Health insurance ({fmt(healthInsurance)}/mo x 12)
            </span>
            <span className="text-house-lights">
              {fmt(annualHealthInsurance)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-aluminum/65">
              + Gear & equipment ({fmt(gearCosts)}/mo x 12)
            </span>
            <span className="text-house-lights">{fmt(annualGearCosts)}</span>
          </div>
          <div className="border-t border-white/5 pt-3 flex justify-between">
            <span className="text-aluminum/65">= Pre-tax target</span>
            <span className="text-house-lights">
              {fmt(income + totalExpenses)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-aluminum/65">
              + Self-employment tax (15.3%)
            </span>
            <span className="text-house-lights">{fmt(seTaxAmount)}</span>
          </div>
          <div className="border-t border-white/5 pt-3 flex justify-between font-bold">
            <span className="text-aluminum/70">= Gross income needed</span>
            <span className="text-signal-orange">{fmt(grossNeeded)}</span>
          </div>
          <div className="border-t border-white/5 pt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-aluminum/65">
                Working days per year
              </span>
              <span className="text-house-lights">{workingDays}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-aluminum/65">
                - Slow months ({slowMonths} mo = {Math.round((slowMonths / 12) * 100)}% reduction)
              </span>
              <span className="text-house-lights">
                -{workingDays - effectiveDays} days
              </span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-aluminum/70">= Billable days</span>
              <span className="text-signal-orange">{effectiveDays}</span>
            </div>
          </div>
          <div className="border-t border-white/5 pt-3 flex justify-between font-bold text-base">
            <span className="text-aluminum/70">
              {fmt(grossNeeded)} / {effectiveDays} days
            </span>
            <span className="text-signal-orange">{fmt(dayRate)}/day</span>
          </div>
        </div>
      </section>

      {/* ===== CONTEXT ===== */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-6">
          What This Doesn&apos;t Include
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            {
              label: "Federal & State Income Tax",
              desc: "This calculator covers self-employment tax only. Set aside an additional 15-25% for income tax depending on your bracket and state.",
            },
            {
              label: "Retirement Savings",
              desc: "SEP-IRA, Solo 401(k), or other retirement contributions. Add these to your target income if you want to save for retirement.",
            },
            {
              label: "Business Expenses",
              desc: "Vehicle, travel, meals, phone, internet, professional development, and liability insurance.",
            },
            {
              label: "Rate Negotiations",
              desc: "Markets vary. A day rate in San Francisco is different from Nashville. Check the Truss Rate Guide for city-specific data.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-deep-stage/40 border border-ink/[0.05]"
            >
              <h3 className="font-heading text-xs font-bold tracking-wider uppercase text-signal-orange mb-1.5">
                {item.label}
              </h3>
              <p className="text-[12px] text-aluminum/60 leading-[1.7]">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="text-center py-12 border-t border-ink/[0.03]">
        <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight mb-3">
          Know Your Rate. <span className="text-signal-orange">Own Your Career.</span>
        </h2>
        <p className="text-sm text-aluminum/60 mb-6 max-w-md mx-auto">
          Set your day rate on Truss and let producers find you. Free profile, no middlemen, no markup.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-signal-orange text-white font-heading font-bold text-sm tracking-[3px] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(255,77,0,0.25)] transition-all"
          >
            Create Your Profile — Free
          </Link>
          <Link
            href="/rates"
            className="inline-block px-8 py-4 bg-transparent text-aluminum font-heading font-bold text-sm tracking-[3px] uppercase rounded-xl border border-white/10 hover:border-signal-orange/30 hover:bg-signal-orange/[0.03] transition-all"
          >
            View Rate Guide
          </Link>
        </div>
      </section>

      <footer className="max-w-3xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-[11px] text-aluminum/40 leading-relaxed">
          This calculator provides estimates for informational purposes only. It is not financial or tax advice. Actual rates depend on your market, experience, specialization, and business expenses. Consult a tax professional for guidance specific to your situation.
        </p>
      </footer>
    </main>
  );
}