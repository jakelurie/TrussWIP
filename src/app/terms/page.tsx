import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Truss",
  description:
    "Terms of Service for Truss, the marketplace for AV technicians and event producers.",
};

const sections = [
  {
    title: "1. Overview",
    content: `Truss ("the Platform") is an online marketplace operated by Truss Technologies LLC ("we," "us," or "our") that connects event producers ("Producers") with audio-visual technicians ("Technicians"). By using the Platform, you agree to these Terms of Service.`,
  },
  {
    title: "2. Platform Role",
    content: `Truss is a marketplace and technology platform only. We are not a staffing agency, employer, or labor provider. We do not employ, supervise, direct, or control any Technician listed on the Platform.

The Platform facilitates connections between Producers and Technicians and provides tools for booking, communication, and payment processing. Truss does not guarantee the quality, safety, legality, or availability of any services offered by Technicians, nor do we guarantee the ability of Producers to pay for services.`,
  },
  {
    title: "3. Independent Contractor Status",
    content: `Technicians are independent contractors, not employees of Truss or of any Producer unless a separate employment agreement exists between a Producer and Technician outside of the Platform.

When a Producer books a Technician through the Platform, the resulting working relationship is a direct contractual arrangement between the Producer and the Technician.`,
    lists: [
      {
        heading: "The Producer is responsible for:",
        items: [
          "Determining the scope of work, schedule, and requirements for each engagement",
          "Compliance with all applicable tax laws, including issuing IRS Form 1099 to Technicians as required",
          "Providing a safe working environment in accordance with applicable laws",
          "Verifying any required licenses, certifications, or insurance",
        ],
      },
      {
        heading: "Technicians are responsible for:",
        items: [
          "Reporting all income received through the Platform to applicable tax authorities",
          "Maintaining any required professional licenses, certifications, or insurance",
          "Providing their own tools and equipment unless otherwise agreed upon with the Producer",
          "Setting their own rates and availability",
        ],
      },
    ],
  },
  {
    title: "4. Accounts and Registration",
    content: `You must create an account to use the Platform. You agree to provide accurate, current, and complete information during registration and to keep your account information updated. You are responsible for all activity under your account.

You must be at least 18 years old to create an account and use the Platform.`,
  },
  {
    title: "5. Bookings and Payments",
    content: `Producers may submit booking requests to Technicians through the Platform. A booking is not confirmed until the Technician accepts the request and the Producer confirms the booking.

Truss charges a platform service fee on each confirmed booking. This fee is displayed transparently during the booking process. Current platform fees are 10% of the booking total, charged to the Producer.

Payment processing is handled by our third-party payment processor (Stripe). By using the Platform, you agree to be bound by Stripe's terms of service in addition to these Terms.

Truss is not responsible for disputes between Producers and Technicians regarding payment, scope of work, or quality of services. We encourage parties to resolve disputes directly, but may offer mediation at our discretion.`,
  },
  {
    title: "6. Cancellation Policy",
    content: `Cancellations made more than 72 hours before the scheduled start of work will receive a full refund minus any applicable processing fees. Cancellations made within 72 hours may be subject to a cancellation fee of up to 50% of the booking total.

Technicians who cancel confirmed bookings may have their profiles flagged or suspended at Truss's discretion. Repeated cancellations may result in account termination.`,
  },
  {
    title: "7. Reviews and Ratings",
    content: `After a completed booking, Producers may leave reviews and ratings for Technicians. Reviews must be honest, accurate, and based on the actual experience. Truss reserves the right to remove reviews that are fraudulent, abusive, or violate these Terms.`,
  },
  {
    title: "8. Limitation of Liability",
    content: `To the fullest extent permitted by law, Truss shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform, including but not limited to:`,
    lists: [
      {
        heading: "",
        items: [
          "Damages arising from the conduct of any Technician or Producer",
          "Property damage or personal injury occurring during any engagement",
          "Loss of profits, data, or business opportunities",
          "Any failure of a Technician to perform services or a Producer to make payment",
        ],
      },
    ],
    afterList: `Truss's total liability for any claim arising from these Terms or the Platform shall not exceed the total fees paid by you to Truss in the twelve (12) months preceding the claim.`,
  },
  {
    title: "9. Indemnification",
    content: `You agree to indemnify and hold harmless Truss, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including reasonable attorneys' fees) arising from your use of the Platform, your violation of these Terms, or your violation of any applicable law.`,
  },
  {
    title: "10. Intellectual Property",
    content: `All content, features, and functionality of the Platform (including but not limited to text, graphics, logos, and software) are the exclusive property of Truss Technologies LLC and are protected by applicable intellectual property laws. Content uploaded by users (including profile information, portfolio items, and reviews) remains the property of the respective users, but you grant Truss a non-exclusive license to display such content on the Platform.`,
  },
  {
    title: "11. Account Termination",
    content: `Truss reserves the right to suspend or terminate your account at any time for violation of these Terms, fraudulent activity, or any conduct that we determine to be harmful to the Platform or its users. You may terminate your account at any time by contacting us.`,
  },
  {
    title: "12. Dispute Resolution",
    content: `In the event of a dispute between a Producer and a Technician regarding a booking, the parties are encouraged to resolve the matter directly through the Platform's messaging system.

If a direct resolution cannot be reached, either party may submit a dispute to Truss by contacting us at hello@trusswork.org within 14 days of the completed or cancelled booking. Truss may, at its sole discretion, review the dispute and make a non-binding recommendation. Truss's recommendations may include full refund, partial refund, or no refund.

Truss is not obligated to mediate or resolve disputes between users. Our decision to intervene is discretionary and our recommendations are not legally binding. For disputes involving potential legal claims, we recommend consulting an attorney.

In no event shall Truss be held liable for the outcome of any dispute between users, whether or not Truss participated in the resolution process.`,
  },
  {
    title: "13. Insurance Disclaimer",
    content: `The Platform allows Technicians to self-report their insurance status, including general liability, professional liability, and workers' compensation coverage. This information is provided by the Technician and is not verified, guaranteed, or endorsed by Truss.

Producers are responsible for independently verifying any insurance coverage, certifications, or licenses that they require for their events. Truss makes no representations about the accuracy, validity, or adequacy of any insurance information displayed on the Platform.

Truss does not provide, sell, or broker insurance of any kind. Any insurance-related information or resources shared on the Platform are for informational purposes only.`,
  },
  {
    title: "14. No Non-Compete or Exclusivity",
    content: `Truss does not impose non-compete clauses, exclusivity agreements, or restrictions on the working relationships of any user. Technicians are free to work with any Producer, agency, or client — whether found through the Platform or otherwise.

Producers and Technicians who form a direct working relationship through the Platform are free to continue that relationship outside of the Platform. However, bookings processed through the Platform are subject to the applicable platform fees.

If a Producer and Technician choose to work together outside of the Platform after being connected through Truss, Truss has no claim to fees on those engagements not processed through the Platform.`,
  },
  {
    title: "15. Prohibited Conduct",
    content: `You agree not to:`,
    lists: [
      {
        heading: "",
        items: [
          "Create false or misleading profiles, reviews, or booking information",
          "Harass, threaten, or discriminate against any user",
          "Use the Platform for any unlawful purpose",
          "Attempt to circumvent platform fees on bookings arranged through the Platform",
          "Scrape, harvest, or collect user data from the Platform",
          "Impersonate another person or entity",
          "Interfere with or disrupt the Platform or its infrastructure",
          "Post false or fraudulent insurance, certification, or credential information",
        ],
      },
    ],
    afterList: `Violation of these rules may result in account suspension or termination at Truss's discretion.`,
  },
  {
    title: "16. Privacy",
    content: `Your use of the Platform is also governed by our Privacy Policy, which describes how we collect, use, and protect your personal information. By using the Platform, you consent to the practices described in the Privacy Policy.`,
    link: { text: "Read the Privacy Policy", href: "/privacy" },
  },
  {
    title: "17. Modifications",
    content: `We may update these Terms from time to time. We will notify users of material changes via email or through the Platform. Continued use of the Platform after changes take effect constitutes acceptance of the updated Terms.`,
  },
  {
    title: "18. Governing Law",
    content: `These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions. Any disputes arising from these Terms or the Platform shall be resolved in the courts located in San Francisco County, California.`,
  },
  {
    title: "19. Contact",
    content: `If you have questions about these Terms, contact us at:`,
    contact: true,
  },
];

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <Link
          href="/"
          className="inline-block font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange hover:text-orange-400 transition-colors mb-6"
        >
          Truss
        </Link>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-wide uppercase leading-tight mb-2">
          Terms of <span className="text-signal-orange">Service</span>
        </h1>
        <p className="text-sm text-aluminum">Last updated: February 2026</p>
      </div>

      <div className="space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-heading text-base font-bold tracking-wider uppercase mb-3">
              {s.title}
            </h2>
            {s.content.split("\n\n").map((p, i) => (
              <p
                key={i}
                className="text-sm text-aluminum leading-relaxed mb-3"
              >
                {p}
              </p>
            ))}
            {s.lists?.map((list, li) => (
              <div key={li} className="mb-3">
                {list.heading && (
                  <p className="text-sm text-house-lights/80 mb-2">
                    {list.heading}
                  </p>
                )}
                <ul className="space-y-1.5 ml-4">
                  {list.items.map((item, ii) => (
                    <li
                      key={ii}
                      className="text-sm text-aluminum leading-relaxed flex items-start gap-2"
                    >
                      <span className="text-signal-orange/40 mt-1.5 text-[6px]">
                        ●
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {s.afterList && (
              <p className="text-sm text-aluminum leading-relaxed mb-3">
                {s.afterList}
              </p>
            )}
            {s.link && (
              <Link
                href={s.link.href}
                className="text-sm text-signal-orange hover:underline"
              >
                {s.link.text} →
              </Link>
            )}
            {s.contact && (
              <div className="text-sm text-aluminum">
                <a
                  href="mailto:hello@trusswork.org"
                  className="text-signal-orange hover:underline"
                >
                  hello@trusswork.org
                </a>
              </div>
            )}
          </section>
        ))}
      </div>

      <footer className="mt-12 pt-6 border-t border-ink/[0.06] text-center">
        <p className="text-xs text-aluminum/50">
          &copy; 2026 Truss Technologies LLC. All rights reserved.
        </p>
        <div className="flex justify-center gap-4 mt-3">
          <Link
            href="/privacy"
            className="text-xs text-aluminum/60 hover:text-signal-orange transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/"
            className="text-xs text-aluminum/60 hover:text-signal-orange transition-colors"
          >
            trusswork.org
          </Link>
        </div>
      </footer>
    </main>
  );
}
