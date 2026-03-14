"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { generateInvoicePDF } from "@/lib/invoice-pdf";

export default function Invoices() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [producerProfile, setProducerProfile] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: prof } = await supabase.from("profiles")
      .select("display_name, company_name").eq("id", session.user.id).single();
    setProducerProfile(prof);

    const { data: invs } = await supabase.from("invoices")
      .select("*").eq("producer_id", session.user.id)
      .order("created_at", { ascending: false });
    setInvoices(invs || []);

    if (invs && invs.length > 0) {
      setSelected(invs[0]);
      loadBookingsForInvoice(invs[0].id, session.user.id);
    }
    setLoading(false);
  };

  const loadBookingsForInvoice = async (invoiceId: string, userId: string) => {
    const { data } = await supabase.from("bookings")
      .select("*, projects(name, city), project_roles(skill), profiles!bookings_tech_id_fkey(display_name)")
      .eq("invoice_id", invoiceId)
      .eq("producer_id", userId)
      .order("created_at", { ascending: false });
    setBookings(data || []);
  };

  const downloadPDF = (inv: any) => {
    const pdf = generateInvoicePDF({
      invoiceNumber: inv.invoice_number,
      producerName: producerProfile?.display_name || "Producer",
      companyName: producerProfile?.company_name,
      periodStart: inv.period_start,
      periodEnd: inv.period_end,
      dueDate: inv.due_date,
      bookings: bookings.map(b => ({
        projectName: b.projects?.name || "Project",
        city: b.projects?.city || "",
        techName: b.profiles?.display_name || "Tech",
        role: b.project_roles?.skill || "Tech",
        hours: b.total_hours || 0,
        rate: b.rate || 0,
        amount: b.total_amount || 0,
        poNumber: b.po_number,
        date: b.created_at,
      })),
      subtotal: inv.subtotal || 0,
      platformFees: inv.platform_fees || 0,
      total: inv.total || 0,
    });
    pdf.save(`truss-invoice-${inv.invoice_number}.pdf`);
  };

  const STATUS_COLORS: Record<string, string> = {
    draft: "var(--color-aluminum)",
    sent: "var(--color-cue-blue)",
    paid: "var(--color-go-green)",
    overdue: "var(--color-signal-orange)",
    cancelled: "var(--color-aluminum)",
  };

  if (loading) return (<div className="min-h-screen flex items-center justify-center"><div className="inline-block w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" /></div>);

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="font-mono text-[10px] text-signal-orange tracking-[3px] uppercase">Billing</span>
            <h1 className="font-heading text-2xl font-bold tracking-tight mt-1">
              <span className="text-signal-orange">Invoices</span>
            </h1>
          </div>
          <Link href="/billing" className="px-4 py-2 text-xs font-mono text-aluminum/65 border border-ink/[0.06] rounded-lg hover:border-white/10 transition-all">
            ← Billing Settings
          </Link>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-24 bg-deep-stage/30 rounded-xl border border-ink/[0.03]">
            <div className="font-heading text-lg text-aluminum/65">No invoices yet</div>
            <p className="text-xs text-aluminum/50 mt-2">Invoices are generated at the end of each billing period</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map(inv => (
              <div key={inv.id}
                onClick={() => { setSelected(inv); loadBookingsForInvoice(inv.id, inv.producer_id); }}
                className={`bg-deep-stage/40 border rounded-xl p-5 cursor-pointer transition-all ${
                  selected?.id === inv.id ? "border-signal-orange/20" : "border-ink/[0.03] hover:border-ink/[0.08]"
                }`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-heading text-lg font-bold">{inv.invoice_number}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase"
                      style={{ color: STATUS_COLORS[inv.status], background: `${STATUS_COLORS[inv.status]}15`, border: `1px solid ${STATUS_COLORS[inv.status]}30` }}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="font-mono text-xl font-semibold">${inv.total?.toLocaleString()}</div>
                </div>
                <div className="flex justify-between text-[11px] text-aluminum/60">
                  <span>
                    {inv.period_start && new Date(inv.period_start).toLocaleDateString()} — {inv.period_end && new Date(inv.period_end).toLocaleDateString()}
                  </span>
                  <span>
                    Due: {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}
                  </span>
                </div>

                {/* Expanded detail */}
                {selected?.id === inv.id && bookings.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-ink/[0.04]">
                    <div className="font-mono text-[10px] text-aluminum/50 tracking-wider uppercase mb-3">Bookings on this invoice</div>
                    <div className="space-y-2">
                      {bookings.map(b => (
                        <div key={b.id} className="flex justify-between items-center px-3 py-2 bg-blackout/20 rounded-lg">
                          <div>
                            <div className="text-xs font-semibold">{b.projects?.name}</div>
                            <div className="text-[9px] text-aluminum/50">{b.projects?.city} · {new Date(b.created_at).toLocaleDateString()}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-sm">${b.total_amount}</div>
                            {b.po_number && <div className="text-[9px] text-aluminum/40 font-mono">PO: {b.po_number}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-ink/[0.04]">
                      <div className="text-[11px] text-aluminum/60">
                        <span>Subtotal: ${inv.subtotal?.toLocaleString()}</span>
                        <span className="mx-2">·</span>
                        <span>Platform fee: ${inv.platform_fees?.toLocaleString()}</span>
                      </div>
                      <div className="font-mono text-lg font-bold text-signal-orange">${inv.total?.toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {inv.status === "sent" && (
                        <button className="flex-1 px-5 py-2.5 bg-signal-orange text-white font-heading font-semibold text-xs tracking-wider uppercase rounded-lg hover:shadow-[0_0_20px_rgba(255,77,0,0.2)] transition-all">
                          Pay Invoice
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadPDF(inv); }}
                        className="px-5 py-2.5 bg-ink/[0.03] border border-ink/[0.06] text-aluminum font-heading text-xs tracking-wider uppercase rounded-lg hover:border-signal-orange/20 hover:text-signal-orange transition-all"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </main>
  );
}