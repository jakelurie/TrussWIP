"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function BillingSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Billing fields
  const [billingType, setBillingType] = useState("credit_card");
  const [companyName, setCompanyName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("due_on_booking");

  // Deposit modal
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState(5000);
  const [depositing, setDepositing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setUserId(session.user.id);

    const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    if (prof) {
      setProfile(prof);
      setBillingType(prof.billing_type || "credit_card");
      setCompanyName(prof.company_name || "");
      setBillingEmail(prof.billing_email || "");
      setBillingAddress(prof.billing_address || "");
      setPaymentTerms(prof.payment_terms || "due_on_booking");
    }

    const { data: txns } = await supabase.from("account_transactions")
      .select("*").eq("producer_id", session.user.id)
      .order("created_at", { ascending: false }).limit(20);
    setTransactions(txns || []);

    setLoading(false);
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "update_billing",
          value: {
            billing_type: billingType,
            company_name: companyName,
            billing_email: billingEmail,
            billing_address: billingAddress,
            payment_terms: paymentTerms,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      // If switching to invoice and pending approval, update local state
      if (data.pendingApproval) {
        setProfile((prev: any) => ({ ...prev, billing_type: "invoice", invoice_approved: false }));
      } else {
        setProfile((prev: any) => ({ ...prev, billing_type: billingType }));
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.message || "Failed to save billing settings");
    }
    setSaving(false);
  };

  const handleDeposit = async () => {
    if (!userId || depositAmount < 100) return;
    setDepositing(true);

    try {
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: depositAmount, userId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
    }
    setDepositing(false);
  };

  const inputClass = "w-full px-4 py-3 bg-blackout/50 border border-ink/[0.06] rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/20 transition-all";

  if (loading) return (<div className="min-h-screen flex items-center justify-center"><div className="inline-block w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" /></div>);

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="font-mono text-[10px] text-signal-orange tracking-[3px] uppercase">Settings</span>
            <h1 className="font-heading text-2xl font-bold tracking-tight mt-1">Billing & <span className="text-signal-orange">Payments</span></h1>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-signal-orange text-white font-heading font-bold text-sm tracking-[2px] uppercase rounded-lg hover:shadow-[0_0_20px_rgba(255,77,0,0.2)] transition-all disabled:opacity-50">
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save Settings"}
          </button>
        </div>

        {/* ===== BILLING TYPE ===== */}
        <section className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 mb-4">
          <h2 className="font-mono text-[10px] text-signal-orange/60 tracking-[3px] uppercase mb-4">Payment Method</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "credit_card", title: "Pay Per Booking", desc: "Credit card charged at time of booking. Best for individual producers and small events." },
              { id: "invoice", title: "Monthly Invoice", desc: "Book all month, receive one invoice. Net 15 or Net 30 terms. Best for companies." },
              { id: "prepaid", title: "Prepaid Balance", desc: "Deposit funds in advance. Bookings deduct from balance. Best for budget control." },
            ].map(opt => (
              <button key={opt.id} onClick={() => setBillingType(opt.id)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  billingType === opt.id
                    ? "border-signal-orange/30 bg-signal-orange/[0.04]"
                    : "border-ink/[0.04] hover:border-white/10"
                }`}>
                <div className="flex items-center gap-2">
                  <div className="font-heading text-sm font-bold">{opt.title}</div>
                  {opt.id === "invoice" && profile?.billing_type === "invoice" && profile?.invoice_approved === true && (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-go-green/15 text-go-green">Approved</span>
                  )}
                  {opt.id === "invoice" && profile?.billing_type === "invoice" && profile?.invoice_approved === false && (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-500">Pending Approval</span>
                  )}
                </div>
                <div className="text-[10px] text-aluminum/60 leading-relaxed mt-1">{opt.desc}</div>
                {billingType === opt.id && <div className="mt-2 text-[10px] font-mono text-signal-orange">Selected</div>}
              </button>
            ))}
          </div>

          {/* Invoice approval status banner */}
          {profile?.billing_type === "invoice" && profile?.invoice_approved === false && (
            <div className="mt-3 bg-yellow-500/[0.06] border border-yellow-500/15 rounded-lg px-4 py-3">
              <div className="text-xs text-yellow-500/90 font-semibold mb-0.5">Invoice billing is pending approval</div>
              <div className="text-[10px] text-aluminum/50 leading-relaxed">
                Your request is being reviewed. You will be notified when approved. In the meantime, bookings require credit card or prepaid balance.
              </div>
            </div>
          )}
          {profile?.billing_type === "invoice" && profile?.invoice_approved === true && profile?.invoice_credit_limit > 0 && (
            <div className="mt-3 bg-go-green/[0.06] border border-go-green/15 rounded-lg px-4 py-3 flex justify-between items-center">
              <div>
                <div className="text-xs text-go-green/90 font-semibold">Invoice billing active</div>
                <div className="text-[10px] text-aluminum/50">Terms: {profile.payment_terms === "net_15" ? "Net 15" : "Net 30"}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-semibold text-house-lights">${profile.invoice_credit_limit.toLocaleString()}</div>
                <div className="text-[9px] text-aluminum/40">Credit limit</div>
              </div>
            </div>
          )}
        </section>

        {/* ===== COMPANY INFO (for invoice/prepaid) ===== */}
        {(billingType === "invoice" || billingType === "prepaid") && (
          <section className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 mb-4">
            <h2 className="font-mono text-[10px] text-signal-orange/60 tracking-[3px] uppercase mb-4">Company Information</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] font-mono text-aluminum/60 tracking-wider uppercase mb-1.5">Company Name</label>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Encore / Pinnacle Live / Your Company" className={inputClass} />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-aluminum/60 tracking-wider uppercase mb-1.5">Billing Email</label>
                <input type="email" value={billingEmail} onChange={e => setBillingEmail(e.target.value)} placeholder="ap@yourcompany.com" className={inputClass} />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-[10px] font-mono text-aluminum/60 tracking-wider uppercase mb-1.5">Billing Address</label>
              <textarea value={billingAddress} onChange={e => setBillingAddress(e.target.value)} placeholder="123 Main St, Suite 100&#10;Chicago, IL 60601"
                rows={2} className={inputClass + " resize-none"} />
            </div>
            {billingType === "invoice" && (
              <div className="max-w-[250px]">
                <label className="block text-[10px] font-mono text-aluminum/60 tracking-wider uppercase mb-1.5">Payment Terms</label>
                <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className={inputClass + " appearance-none"}>
                  <option value="net_15">Net 15</option>
                  <option value="net_30">Net 30</option>
                </select>
              </div>
            )}
          </section>
        )}

        {/* ===== PREPAID BALANCE ===== */}
        {billingType === "prepaid" && (
          <section className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 mb-4">
            <h2 className="font-mono text-[10px] text-signal-orange/60 tracking-[3px] uppercase mb-4">Account Balance</h2>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="font-mono text-4xl font-semibold">
                  ${(profile?.account_balance || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-aluminum/60 mt-1">Available balance</div>
              </div>
              <button onClick={() => setShowDeposit(!showDeposit)}
                className="px-5 py-2.5 bg-signal-orange text-white font-heading font-bold text-xs tracking-[2px] uppercase rounded-lg hover:shadow-[0_0_20px_rgba(255,77,0,0.2)] transition-all">
                + Add Funds
              </button>
            </div>

            {showDeposit && (
              <div className="bg-blackout/30 border border-signal-orange/15 rounded-lg p-4 mb-4">
                <div className="font-mono text-[10px] text-aluminum/60 tracking-wider uppercase mb-3">Deposit Funds</div>
                <div className="flex gap-2 mb-3">
                  {[1000, 2500, 5000, 10000, 25000].map(amt => (
                    <button key={amt} onClick={() => setDepositAmount(amt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                        depositAmount === amt
                          ? "bg-signal-orange/15 text-signal-orange border border-signal-orange/25"
                          : "bg-ink/[0.02] text-aluminum/65 border border-ink/[0.05] hover:border-white/10"
                      }`}>
                      ${amt.toLocaleString()}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] font-mono text-aluminum/60 tracking-wider uppercase mb-1.5">Custom Amount</label>
                    <input type="number" value={depositAmount} onChange={e => setDepositAmount(parseInt(e.target.value) || 0)}
                      min="100" className={inputClass} />
                  </div>
                  <button onClick={handleDeposit} disabled={depositing || depositAmount < 100}
                    className="px-6 py-3 bg-signal-orange text-white font-heading font-bold text-xs tracking-[2px] uppercase rounded-lg hover:shadow-[0_0_20px_rgba(255,77,0,0.2)] transition-all disabled:opacity-50">
                    {depositing ? "Processing..." : `Deposit $${depositAmount.toLocaleString()}`}
                  </button>
                </div>
              </div>
            )}

            {/* Transaction history */}
            {transactions.length > 0 && (
              <div>
                <div className="font-mono text-[10px] text-aluminum/60 tracking-wider uppercase mb-3">Recent Transactions</div>
                <div className="space-y-1">
                  {transactions.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center px-3 py-2.5 bg-blackout/20 rounded-lg">
                      <div>
                        <div className="text-xs">{tx.description}</div>
                        <div className="text-[9px] text-aluminum/40 font-mono">{new Date(tx.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono text-sm font-semibold ${tx.type === "deposit" || tx.type === "refund" ? "text-go-green" : "text-signal-orange"}`}>
                          {tx.type === "deposit" || tx.type === "refund" ? "+" : "-"}${Math.abs(tx.amount).toLocaleString()}
                        </span>
                        <span className="font-mono text-[9px] text-aluminum/35">${tx.balance_after?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ===== INVOICES LINK ===== */}
        {billingType === "invoice" && (
          <section className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-mono text-[10px] text-signal-orange/60 tracking-[3px] uppercase">Invoices</h2>
                <p className="text-[11px] text-aluminum/50 mt-1">View and pay your monthly invoices</p>
              </div>
              <a href="/invoices" className="px-4 py-2 bg-ink/[0.03] text-aluminum/60 text-xs font-mono rounded-lg border border-ink/[0.06] hover:border-white/10 transition-all">
                View Invoices →
              </a>
            </div>
          </section>
        )}

        {/* ===== INFO ===== */}
        <div className="bg-blackout/30 border border-ink/[0.03] rounded-xl p-4 mt-6">
          <div className="text-[10px] text-aluminum/40 leading-relaxed">
            <span className="text-aluminum/60 font-semibold">How billing works:</span> Truss charges a 10% platform fee on all bookings.
            {billingType === "credit_card" && " Your card is charged when you confirm each booking."}
            {billingType === "invoice" && " All bookings during the billing period are consolidated into a single invoice sent at month end."}
            {billingType === "prepaid" && " Booking costs are deducted from your prepaid balance. You'll be notified when your balance is low."}
            {" "}Technicians set their own rates — Truss does not mark up labor costs.
          </div>
        </div>

        <div className="flex justify-end mt-4 mb-12">
          {saved && <span className="text-go-green font-mono text-xs mr-4 self-center">✓ Saved</span>}
          <button onClick={handleSave} disabled={saving}
            className="px-8 py-3 bg-signal-orange text-white font-heading font-bold text-sm tracking-[2px] uppercase rounded-lg hover:shadow-[0_0_20px_rgba(255,77,0,0.2)] transition-all disabled:opacity-50">
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
    </main>
  );
}