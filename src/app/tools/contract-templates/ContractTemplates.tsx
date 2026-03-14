"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Template Data ───────────────────────────────────────────

interface Template {
  id: string;
  title: string;
  description: string;
  content: string;
}

const TEMPLATES: Template[] = [
  {
    id: "service-agreement",
    title: "Freelance Service Agreement",
    description: "A one-page contract between a technician and a client/producer. Covers rate, scope, cancellation, liability, and independent contractor status.",
    content: `FREELANCE SERVICE AGREEMENT

This Agreement is entered into as of [DATE] by and between:

TECHNICIAN:
Name: [YOUR FULL NAME]
Address: [YOUR ADDRESS]
Phone: [YOUR PHONE]
Email: [YOUR EMAIL]

CLIENT:
Name/Company: [CLIENT NAME OR COMPANY]
Contact: [CLIENT CONTACT NAME]
Address: [CLIENT ADDRESS]
Phone: [CLIENT PHONE]
Email: [CLIENT EMAIL]

─────────────────────────────────────────────

1. EVENT DETAILS

Event Name: [EVENT NAME]
Date(s): [EVENT DATE(S)]
Location: [VENUE NAME AND ADDRESS]
Role: [YOUR ROLE — e.g., A1 Audio Engineer, LED Technician, Lighting Director]
Call Time: [CALL TIME]
Estimated End Time: [END TIME]

2. COMPENSATION

Rate: $[AMOUNT] per [HOUR / DAY / FLAT]
Estimated Hours: [NUMBER]
Estimated Total: $[TOTAL]
Overtime: Hours beyond [X] per day billed at 1.5x rate

3. PAYMENT TERMS

Payment is due: [DUE ON COMPLETION / NET 15 / NET 30]
Payment method: [CHECK / ACH / ZELLE / VENMO / WIRE]
Late payments are subject to a 1.5% monthly finance charge.

4. CANCELLATION

- 48+ hours notice: Full refund, no charges.
- Less than 48 hours notice: 50% of estimated total is due as a cancellation fee.
- Day-of cancellation or no-show by Client: 100% of estimated total is due.

5. SCOPE OF WORK

[DESCRIBE THE WORK — e.g., "Technician will operate the FOH audio console for the general session, mix 6 wireless microphones and program playback, and assist with load-in and strike of the audio system."]

6. INDEPENDENT CONTRACTOR STATUS

Technician is an independent contractor, not an employee of Client. Technician is responsible for their own taxes, insurance, and benefits. Client will not withhold taxes or provide workers' compensation coverage.

7. LIABILITY & INSURANCE

Each party is responsible for their own liability insurance. Technician carries general liability insurance with a minimum coverage of $[1,000,000] per occurrence. Technician is not liable for delays or failures caused by venue conditions, weather, acts of God, or other circumstances beyond their control.

8. EQUIPMENT

[IF APPLICABLE: "Technician will provide the following personal equipment: [LIST]. Client is responsible for all other equipment required for the scope of work."]
[IF NOT APPLICABLE: "All equipment will be provided by Client or Client's vendor."]

9. SIGNATURES

By signing below, both parties agree to the terms outlined in this Agreement.


Technician Signature: ___________________________  Date: ____________

Print Name: [YOUR FULL NAME]


Client Signature: ___________________________  Date: ____________

Print Name: [CLIENT CONTACT NAME]
Title: [TITLE]`,
  },
  {
    id: "rate-confirmation",
    title: "Rate Confirmation Email",
    description: "A professional email template to confirm a gig, rate, and logistics with a client before the event.",
    content: `Subject: Confirming [EVENT NAME] — [DATE(S)]

Hi [CLIENT FIRST NAME],

Thanks for booking me for [EVENT NAME]. Here's a summary of what we discussed:

Event: [EVENT NAME]
Date(s): [DATE(S)]
Call Time: [CALL TIME]
Location: [VENUE NAME AND ADDRESS]
Role: [YOUR ROLE]
Rate: $[AMOUNT] per [HOUR / DAY / FLAT]
Estimated Hours: [NUMBER]
Billing: [INVOICE ON WRAP / NET 15 / NET 30]

[OPTIONAL: "I'll be bringing my own [GEAR LIST]. Please let me know if there's anything else you need me to bring."]

[OPTIONAL: "A few notes:
- [PARKING / LOAD-IN DOCK INSTRUCTIONS]
- [DRESS CODE]
- [ANY OTHER RELEVANT DETAILS]"]

Let me know if anything changes. Looking forward to it.

Best,
[YOUR NAME]
[YOUR PHONE]
[YOUR EMAIL]`,
  },
  {
    id: "invoice",
    title: "Invoice Template",
    description: "A clean invoice format for billing clients after an event. Includes line items, totals, and payment instructions.",
    content: `INVOICE

──────────────────────────────────────────

FROM:
[YOUR FULL NAME]
[YOUR ADDRESS]
[YOUR PHONE]
[YOUR EMAIL]

TO:
[CLIENT NAME OR COMPANY]
[CLIENT CONTACT NAME]
[CLIENT ADDRESS]
[CLIENT EMAIL]

──────────────────────────────────────────

Invoice Number: [INV-XXXX]
Invoice Date: [DATE]
Payment Due: [DUE DATE]
Payment Terms: [DUE ON RECEIPT / NET 15 / NET 30]

──────────────────────────────────────────

EVENT: [EVENT NAME]
LOCATION: [VENUE NAME]

──────────────────────────────────────────

DESCRIPTION                    QTY    RATE        TOTAL
─────────────────────────────────────────────────────────
[ROLE] — [DATE 1]              [HRS]  $[RATE]/hr  $[TOTAL]
[ROLE] — [DATE 2]              [HRS]  $[RATE]/hr  $[TOTAL]
[ADDITIONAL LINE ITEM]         [QTY]  $[RATE]     $[TOTAL]
─────────────────────────────────────────────────────────

                                        SUBTOTAL:  $[AMOUNT]
                                        TAX (if applicable):  $[AMOUNT]
                                        ─────────────────────
                                        TOTAL DUE: $[AMOUNT]

──────────────────────────────────────────

PAYMENT INSTRUCTIONS:

[CHOOSE ONE OR MORE:]
- Zelle: [YOUR EMAIL OR PHONE]
- Venmo: @[YOUR HANDLE]
- ACH: Routing [XXXXXXXX] / Account [XXXXXXXX]
- Check payable to: [YOUR NAME OR BUSINESS NAME]
  Mail to: [YOUR ADDRESS]

──────────────────────────────────────────

NOTES:
- Late payments subject to 1.5% monthly finance charge.
- Please reference invoice number [INV-XXXX] with payment.
- Questions? Contact [YOUR EMAIL] or [YOUR PHONE].

Thank you for your business.`,
  },
  {
    id: "w9-explainer",
    title: "W-9 Explainer",
    description: "A plain-English explanation of the W-9 form — what it is, why clients ask for it, what each field means, and security tips.",
    content: `UNDERSTANDING THE W-9 FORM
A Guide for Freelance AV Technicians

──────────────────────────────────────────

WHAT IS A W-9?

The W-9 (Request for Taxpayer Identification Number and Certification) is an IRS form that clients use to collect your legal name and tax ID number. They need this information to report what they paid you to the IRS on a 1099-NEC form at the end of the year.

If a client pays you $600 or more in a calendar year, they are legally required to file a 1099. The W-9 is how they get the information to do that.

──────────────────────────────────────────

WHY CLIENTS ASK FOR IT

It's not optional. Any legitimate production company or corporate client will ask for a W-9 before they can issue payment. Many accounting departments will not process your invoice without a W-9 on file. This is standard practice — not a red flag.

──────────────────────────────────────────

WHAT EACH FIELD MEANS

Line 1 — Name: Your legal name as it appears on your tax return.

Line 2 — Business name: If you operate under a DBA or LLC, put it here. Otherwise leave blank.

Line 3 — Federal tax classification: Most freelance AV techs check "Individual/sole proprietor or single-member LLC" unless you've formed a different entity.

Line 4 — Exemptions: Most freelancers leave this blank. Only applies to certain entities and payments.

Lines 5–6 — Address: Your mailing address for tax documents.

Part I — Taxpayer Identification Number (TIN): Your Social Security Number (SSN) or Employer Identification Number (EIN). If you have an EIN for your freelance business, use that instead of your SSN for an added layer of separation.

Part II — Certification: Your signature confirming the information is correct.

──────────────────────────────────────────

SECURITY: NEVER EMAIL A COMPLETED W-9 UNENCRYPTED

A completed W-9 contains your Social Security Number or EIN. Sending it in a plain email attachment is a significant identity theft risk.

Safer alternatives:
- Use an encrypted file sharing service (e.g., DocuSign, HelloSign)
- Send a password-protected PDF and share the password separately by phone or text
- Upload to the client's secure vendor portal if they have one
- Hand-deliver or fax if other options aren't available

──────────────────────────────────────────

DOWNLOAD THE OFFICIAL FORM

IRS W-9 Form (PDF): https://www.irs.gov/pub/irs-pdf/fw9.pdf

The form is free. You do not need to pay any service to fill it out.

──────────────────────────────────────────

TIPS FOR AV FREELANCERS

- Keep a current W-9 ready to send. Clients often need it before your first gig.
- Consider getting an EIN (free from the IRS) so you don't have to share your SSN.
- Track every client you send a W-9 to — you should receive a 1099 from each one by January 31 of the following year.
- If you don't receive a 1099, you're still required to report the income on your tax return.`,
  },
  {
    id: "coi-request",
    title: "Certificate of Insurance Request",
    description: "A template email to send to your insurance provider requesting a COI that names a specific client as additional insured for an event.",
    content: `Subject: COI Request — [EVENT NAME], [EVENT DATE(S)]

Hi [INSURANCE AGENT NAME / INSURANCE COMPANY],

I need a Certificate of Insurance (COI) for an upcoming event. Please issue a certificate with the following details:

──────────────────────────────────────────

NAMED INSURED (me):
[YOUR FULL NAME OR BUSINESS NAME]
[YOUR ADDRESS]
Policy Number: [YOUR POLICY NUMBER]

──────────────────────────────────────────

ADDITIONAL INSURED (client):
[CLIENT COMPANY NAME]
[CLIENT CONTACT NAME]
[CLIENT ADDRESS]

──────────────────────────────────────────

EVENT DETAILS:
Event Name: [EVENT NAME]
Event Date(s): [DATE(S)]
Event Location: [VENUE NAME AND ADDRESS]

──────────────────────────────────────────

COVERAGE REQUESTED:
- General Liability: $[1,000,000] per occurrence / $[2,000,000] aggregate
- [IF APPLICABLE: Equipment / Inland Marine coverage for personal gear valued at $[AMOUNT]]

Please name the above Additional Insured on the certificate and send the completed COI to:

[CLIENT EMAIL ADDRESS]
CC: [YOUR EMAIL ADDRESS]

──────────────────────────────────────────

I need this by [DATE — ideally 3-5 business days before the event].

Thank you,
[YOUR NAME]
[YOUR PHONE]
[YOUR EMAIL]`,
  },
];

// ─── Copy Button Component ──────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold tracking-wider uppercase transition-all ${
        copied
          ? "bg-go-green/15 text-go-green border border-go-green/20"
          : "bg-signal-orange/10 text-signal-orange border border-signal-orange/20 hover:bg-signal-orange/20"
      }`}
    >
      {copied ? "COPIED" : "COPY TO CLIPBOARD"}
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function ContractTemplates() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <Link
          href="/resources"
          className="inline-block text-[11px] font-mono text-aluminum/60 hover:text-signal-orange transition-colors mb-4"
        >
          &larr; Resources
        </Link>
        <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
          <span className="text-signal-orange">CONTRACT TEMPLATES</span>
          <br />
          <span className="text-xl md:text-2xl text-house-lights/80">for AV Technicians</span>
        </h1>
        <p className="text-sm text-aluminum/65 mt-3 max-w-xl mx-auto">
          Ready-to-use contracts, invoices, and email templates for freelance AV work. Copy, customize, and send.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="mb-10 px-4 py-3 rounded-lg bg-standby-amber/5 border border-standby-amber/15 text-[11px] text-standby-amber/70 font-mono leading-relaxed">
        These templates are for general reference only and do not constitute legal advice. Consult a qualified attorney for contracts specific to your situation.
      </div>

      {/* Templates */}
      <div className="space-y-4 mb-12">
        {TEMPLATES.map((tpl) => {
          const isOpen = expanded === tpl.id;
          return (
            <div
              key={tpl.id}
              className="rounded-xl bg-deep-stage/40 border border-ink/[0.05] overflow-hidden"
            >
              {/* Header / Toggle */}
              <button
                onClick={() => toggle(tpl.id)}
                className="w-full flex items-start gap-4 p-5 text-left group hover:bg-ink/[0.01] transition-colors"
              >
                <div className="flex-1">
                  <h2 className="font-heading text-sm font-bold tracking-wide group-hover:text-signal-orange transition-colors">
                    {tpl.title}
                  </h2>
                  <p className="text-[12px] text-aluminum/60 leading-relaxed mt-1">
                    {tpl.description}
                  </p>
                </div>
                <span className={`text-aluminum/50 text-lg transition-transform mt-0.5 ${isOpen ? "rotate-90" : ""}`}>
                  &rsaquo;
                </span>
              </button>

              {/* Content */}
              {isOpen && (
                <div className="px-5 pb-5">
                  <div className="flex justify-end mb-2">
                    <CopyButton text={tpl.content} />
                  </div>
                  <pre className="bg-blackout/60 border border-ink/[0.05] rounded-lg p-4 text-[11px] font-mono text-house-lights/60 leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-[600px] overflow-y-auto">
                    {tpl.content}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Disclaimer (bottom) */}
      <div className="mb-12 px-4 py-3 rounded-lg bg-standby-amber/5 border border-standby-amber/15 text-[11px] text-standby-amber/70 font-mono leading-relaxed">
        These templates are for general reference only and do not constitute legal advice. Consult a qualified attorney for contracts specific to your situation.
      </div>

      {/* CTA */}
      <section className="text-center py-12 border-t border-ink/[0.03]">
        <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight mb-3">
          Manage Your <span className="text-signal-orange">Bookings & Invoicing</span> on Truss
        </h2>
        <p className="text-sm text-aluminum/60 mb-6 max-w-md mx-auto">
          Stop chasing payments and digging through emails. Truss handles confirmations, invoicing, and payment tracking so you can focus on the gig.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-4 bg-signal-orange text-white font-heading font-bold text-sm tracking-[3px] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(255,77,0,0.25)] transition-all"
        >
          Create Your Profile — Free
        </Link>
      </section>

      <footer className="max-w-3xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-[11px] text-aluminum/40 leading-relaxed">
          These templates are provided for informational purposes only and do not constitute legal advice. Review all contracts with a qualified attorney before use. Truss is not responsible for the legal sufficiency or enforceability of these documents.
        </p>
      </footer>
    </main>
  );
}
