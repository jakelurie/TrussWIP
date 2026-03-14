"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CityCombobox from "@/components/CityCombobox";
import Link from "next/link";

const NOTIFICATION_TYPES = [
  { key: "booking_request", label: "New booking request", all: true },
  { key: "booking_accepted", label: "Booking accepted", all: true },
  { key: "booking_confirmed", label: "Booking confirmed", all: true },
  { key: "booking_declined", label: "Booking declined", all: true },
  { key: "gig_completed", label: "Gig completed", all: true },
  { key: "review_received", label: "New review received", all: true },
  { key: "new_message", label: "New message", all: true },
  { key: "tier_unlocked", label: "Tier unlocked", role: "tech" },
  { key: "profile_viewed_digest", label: "Profile viewed (weekly digest)", role: "tech" },
  { key: "saved_search_match", label: "Saved search match", role: "tech" },
  { key: "project_files", label: "New project files uploaded", all: true },
];

const CANCEL_POLICIES = [
  { value: "flexible", label: "Flexible", desc: "Cancel anytime" },
  { value: "24hr", label: "24 hours", desc: "Cancel up to 24hr before" },
  { value: "48hr", label: "48 hours", desc: "Cancel up to 48hr before" },
  { value: "72hr", label: "72 hours", desc: "Cancel up to 72hr before" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [techProfile, setTechProfile] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  // Account fields
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Tech quick controls
  const [available, setAvailable] = useState(true);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [cancelPolicy, setCancelPolicy] = useState("flexible");

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState<Record<string, { email: boolean }>>({});

  // Privacy
  const [privacy, setPrivacy] = useState<Record<string, boolean>>({
    profile_visible: true,
    show_rate: true,
    show_gear: true,
    allow_messages_all: true,
  });

  // Danger zone
  const [showDanger, setShowDanger] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // UI
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const [calendarCopied, setCalendarCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s) { router.push("/login"); return; }
      setSession(s);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", s.user.id)
        .single();

      if (prof) {
        setProfile(prof);
        setDisplayName(prof.display_name || "");
        setCity(prof.city || "");
        setPhone(prof.phone || "");
        setCompanyName(prof.company_name || "");
        setNotifPrefs(prof.notification_preferences || {});
        if (prof.privacy_settings) setPrivacy(prof.privacy_settings);
      }

      if (prof?.user_type === "tech") {
        const { data: tp } = await supabase
          .from("tech_profiles")
          .select("available, hourly_rate, cancellation_policy")
          .eq("user_id", s.user.id)
          .single();
        if (tp) {
          setTechProfile(tp);
          setAvailable(tp.available ?? true);
          setHourlyRate(tp.hourly_rate || 0);
          setCancelPolicy(tp.cancellation_policy || "flexible");
        }
      }

      setLoading(false);
    })();
  }, [router]);

  const doAction = async (action: string, value: any, label: string) => {
    if (!session) return { ok: false, error: "Not signed in" };
    setSaving(label);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action, value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return { ok: false, error: data.error || "Something went wrong", data };
      }
      setSaved(label);
      setTimeout(() => setSaved(null), 2000);
      return { ok: true, data };
    } catch {
      setError("Something went wrong");
      return { ok: false, error: "Something went wrong" };
    } finally {
      setSaving(null);
    }
  };

  const handleSaveAccount = () => {
    const updates: Record<string, any> = { display_name: displayName, city, phone };
    if (profile?.user_type === "producer") updates.company_name = companyName;
    doAction("update_profile", updates, "account");
  };

  const handleChangeEmail = () => {
    if (!newEmail) return;
    doAction("update_email", newEmail, "email").then((result) => {
      if (result?.ok) {
        setShowEmailForm(false);
      }
    });
  };

  const handleChangePassword = () => {
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    doAction("update_password", newPassword, "password").then((result) => {
      if (result?.ok) {
        setShowPasswordForm(false);
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  };

  const handleNotifToggle = (key: string) => {
    const updated = { ...notifPrefs, [key]: { email: !(notifPrefs[key]?.email ?? true) } };
    setNotifPrefs(updated);
    doAction("update_notifications", updated, "notifications").then((result) => {
      if (!result?.ok) setNotifPrefs(notifPrefs);
    });
  };

  const handlePrivacyToggle = (key: string) => {
    const updated = { ...privacy, [key]: !privacy[key] };
    setPrivacy(updated);
    doAction("update_privacy", updated, "privacy").then((result) => {
      if (!result?.ok) setPrivacy(privacy);
    });
  };

  const handleAvailabilityToggle = () => {
    const next = !available;
    setAvailable(next);
    doAction("update_tech", { available: next }, "availability").then((result) => {
      if (!result?.ok) setAvailable(!next);
    });
  };

  const handleSaveTech = () => {
    doAction("update_tech", { hourly_rate: hourlyRate, cancellation_policy: cancelPolicy }, "tech");
  };

  const handleExport = async () => {
    if (!session) return;
    setExporting(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "export_data", value: null }),
    });
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `truss-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const handleSignOutAll = async () => {
    await doAction("sign_out_all", null, "signout");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    const result = await doAction("delete_account", null, "delete");
    if (result?.ok) {
      await supabase.auth.signOut();
      window.location.href = "/";
    }
  };

  const copyReferral = () => {
    if (!profile?.referral_code) return;
    const url = `${window.location.origin}/signup?ref=${profile.referral_code}`;
    navigator.clipboard.writeText(url);
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  };

  const copyCalendarFeed = () => {
    if (!profile?.calendar_token) return;
    const url = `${window.location.origin}/api/calendar/${profile.id}?token=${profile.calendar_token}`;
    navigator.clipboard.writeText(url);
    setCalendarCopied(true);
    setTimeout(() => setCalendarCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
      </div>
    );
  }

  const isTech = profile?.user_type === "tech";
  const isProducer = profile?.user_type === "producer";
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;
  const inputClass = "w-full bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-2 text-sm text-house-lights placeholder:text-aluminum/30 focus:outline-none focus:border-signal-orange/30 transition-colors";

  return (
    <main className="max-w-[640px] mx-auto px-6 py-8 pb-20">
      <span className="font-mono text-[10px] text-signal-orange tracking-[3px] uppercase">Settings</span>
      <h1 className="font-heading text-2xl font-bold tracking-tight mt-1 mb-1">Account & <span className="text-signal-orange">Preferences</span></h1>
      <div className="flex items-center gap-3 text-[10px] font-mono text-aluminum/40 mb-6">
        <span className="capitalize">{profile?.user_type}</span>
        {memberSince && <><span>·</span><span>Member since {memberSince}</span></>}
        <span>·</span>
        <span className="font-mono text-[9px]">{profile?.id?.slice(0, 8)}</span>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 mb-4 text-xs text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-400/60 hover:text-red-400">dismiss</button>
        </div>
      )}

      {/* ── Account ── */}
      <Section label="Account">
        {/* Email */}
        <Row label="Email">
          <div className="flex items-center gap-2">
            <span className="text-sm text-house-lights/70 font-mono">{profile?.email || session?.user?.email}</span>
            <button onClick={() => setShowEmailForm(!showEmailForm)}
              className="text-[10px] font-mono text-signal-orange/60 hover:text-signal-orange transition-colors">
              {showEmailForm ? "Cancel" : "Change"}
            </button>
          </div>
          {showEmailForm && (
            <div className="mt-2 flex gap-2">
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                placeholder="New email address" className={inputClass + " flex-1"} />
              <Btn onClick={handleChangeEmail} loading={saving === "email"}>Update</Btn>
            </div>
          )}
        </Row>

        {/* Password */}
        <Row label="Password">
          <button onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="text-[10px] font-mono text-signal-orange/60 hover:text-signal-orange transition-colors">
            {showPasswordForm ? "Cancel" : "Change Password"}
          </button>
          {showPasswordForm && (
            <div className="mt-2 space-y-2">
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 8 characters)" className={inputClass} />
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password" className={inputClass} />
              <Btn onClick={handleChangePassword} loading={saving === "password"}>Update Password</Btn>
            </div>
          )}
        </Row>

        {/* Name */}
        <Row label="Display Name">
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} />
        </Row>

        {/* Phone */}
        <Row label="Phone">
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 123 4567" className={inputClass} />
        </Row>

        {/* City */}
        <Row label="City">
          <CityCombobox value={city} onChange={setCity} placeholder="Search for your city..." />
        </Row>

        {/* Company (Producer only) */}
        {isProducer && (
          <Row label="Company">
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company or organization name" className={inputClass} />
          </Row>
        )}

        <div className="pt-2">
          <button onClick={handleSaveAccount} disabled={saving === "account"}
            className="px-4 py-2 text-xs font-mono uppercase tracking-wider bg-signal-orange text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50">
            {saving === "account" ? "Saving..." : saved === "account" ? "Saved" : "Save Changes"}
          </button>
        </div>
      </Section>

      {/* ── Quick Controls (Tech Only) ── */}
      {isTech && techProfile && (
        <Section label="Quick Controls">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-xs text-house-lights/70">Available for bookings</div>
              <div className="text-[10px] text-aluminum/35 mt-0.5">
                {available ? "Your profile appears in search results" : "Hidden from search — existing bookings unaffected"}
              </div>
            </div>
            <Toggle enabled={available} onChange={handleAvailabilityToggle} />
          </div>

          <Row label="Default Hourly Rate">
            <div className="flex items-center gap-2">
              <span className="text-sm text-aluminum">$</span>
              <input type="number" value={hourlyRate || ""} onChange={(e) => setHourlyRate(parseInt(e.target.value) || 0)}
                min="0" max="500" className={inputClass + " w-28 text-center"} />
              <span className="text-[10px] text-aluminum/40">/hr</span>
            </div>
          </Row>

          <Row label="Cancellation Policy">
            <div className="grid grid-cols-2 gap-2">
              {CANCEL_POLICIES.map(p => (
                <button key={p.value} onClick={() => setCancelPolicy(p.value)}
                  className={`p-2 rounded-lg text-xs font-mono text-left border transition-all ${
                    cancelPolicy === p.value
                      ? "border-signal-orange/30 bg-signal-orange/10 text-signal-orange"
                      : "border-white/5 text-aluminum hover:border-white/10"
                  }`}>
                  <div className="font-semibold">{p.label}</div>
                  <div className="text-[9px] text-aluminum/50 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </Row>

          <div className="pt-2">
            <button onClick={handleSaveTech} disabled={saving === "tech"}
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider bg-signal-orange text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50">
              {saving === "tech" ? "Saving..." : saved === "tech" ? "Saved" : "Save"}
            </button>
          </div>
        </Section>
      )}

      {/* ── Notifications ── */}
      <Section label="Notifications">
        <div className="flex items-center justify-end gap-4 mb-1 pr-1">
          <span className="text-[9px] font-mono text-aluminum/40 tracking-wider uppercase w-12 text-center">Email</span>
        </div>
        {NOTIFICATION_TYPES
          .filter((n) => n.all || n.role === profile?.user_type)
          .map((n) => {
            const enabled = notifPrefs[n.key]?.email ?? (
              n.key === "profile_viewed_digest" || n.key === "saved_search_match" ? false : true
            );
            return (
              <div key={n.key} className="flex items-center justify-between py-2 border-t border-ink/[0.03]">
                <span className="text-xs text-house-lights/70">{n.label}</span>
                <Toggle enabled={enabled} onChange={() => handleNotifToggle(n.key)} />
              </div>
            );
          })}
      </Section>

      {/* ── Privacy ── */}
      <Section label="Privacy">
        {isTech && (
          <>
            <PrivacyRow label="Profile visible in search results"
              desc="When off, your profile won't appear in browse results. Direct URL still works."
              enabled={privacy.profile_visible ?? true} onToggle={() => handlePrivacyToggle("profile_visible")} />
            <PrivacyRow label="Show rate on profile"
              desc="When off, rate displays as 'Contact for rate' publicly."
              enabled={privacy.show_rate ?? true} onToggle={() => handlePrivacyToggle("show_rate")} />
            <PrivacyRow label="Show gear list publicly"
              desc="When off, your gear inventory is hidden from your public profile."
              enabled={privacy.show_gear ?? true} onToggle={() => handlePrivacyToggle("show_gear")} />
          </>
        )}
        <PrivacyRow label="Allow messages from anyone"
          desc={isTech
            ? "When off, only producers with an active or past booking can message you."
            : "When off, only techs you've booked can message you."}
          enabled={privacy.allow_messages_all ?? true} onToggle={() => handlePrivacyToggle("allow_messages_all")} />

        <div className="border-t border-ink/[0.03] pt-3 mt-2">
          <button onClick={handleExport} disabled={exporting}
            className="text-xs font-mono text-aluminum/60 hover:text-signal-orange transition-colors disabled:opacity-50">
            {exporting ? "Exporting..." : "Download my data (JSON)"}
          </button>
        </div>
      </Section>

      {/* ── Billing (Producer Only) ── */}
      {isProducer && (
        <Section label="Billing">
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs text-house-lights/70">Billing Method</div>
              <div className="text-[10px] text-aluminum/40 mt-0.5 capitalize">
                {(profile?.billing_type || "credit_card").replace(/_/g, " ")}
              </div>
            </div>
            <Link href="/billing" className="text-[10px] font-mono text-signal-orange/60 hover:text-signal-orange transition-colors">
              Manage &rarr;
            </Link>
          </div>
          <div className="border-t border-ink/[0.03] pt-3 flex items-center justify-between py-1">
            <div>
              <div className="text-xs text-house-lights/70">Invoices</div>
              <div className="text-[10px] text-aluminum/40 mt-0.5">View and pay invoices</div>
            </div>
            <Link href="/invoices" className="text-[10px] font-mono text-signal-orange/60 hover:text-signal-orange transition-colors">
              View &rarr;
            </Link>
          </div>
        </Section>
      )}

      {/* ── Integrations ── */}
      <Section label="Integrations">
        {/* Calendar feed */}
        {isTech && profile?.calendar_token && (
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-xs text-house-lights/70">Calendar Feed</div>
              <div className="text-[10px] text-aluminum/35 mt-0.5">Subscribe in Google Calendar or Apple Calendar</div>
            </div>
            <button onClick={copyCalendarFeed}
              className="text-[10px] font-mono text-signal-orange/60 hover:text-signal-orange transition-colors">
              {calendarCopied ? "Copied" : "Copy URL"}
            </button>
          </div>
        )}

        {/* Referral code */}
        {profile?.referral_code && (
          <div className="flex items-center justify-between py-2 border-t border-ink/[0.03]">
            <div>
              <div className="text-xs text-house-lights/70">Referral Link</div>
              <div className="text-[10px] text-aluminum/35 mt-0.5 font-mono">{profile.referral_code}</div>
            </div>
            <button onClick={copyReferral}
              className="text-[10px] font-mono text-signal-orange/60 hover:text-signal-orange transition-colors">
              {referralCopied ? "Copied" : "Copy Link"}
            </button>
          </div>
        )}

        {!profile?.calendar_token && !profile?.referral_code && (
          <div className="text-xs text-aluminum/30 py-2">No integrations available yet.</div>
        )}
      </Section>

      {/* ── Session & Security ── */}
      <Section label="Session">
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-xs text-house-lights/70">Sign out other devices</div>
            <div className="text-[10px] text-aluminum/35 mt-0.5">Ends all sessions except this one</div>
          </div>
          <button onClick={handleSignOutAll} disabled={saving === "signout"}
            className="text-[10px] font-mono text-signal-orange/60 hover:text-signal-orange transition-colors disabled:opacity-50">
            {saving === "signout" ? "..." : saved === "signout" ? "Done" : "Sign Out All"}
          </button>
        </div>
      </Section>

      {/* ── Danger Zone ── */}
      <section className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 mb-4">
        <button onClick={() => setShowDanger(!showDanger)}
          className="text-[10px] font-mono text-red-400/40 hover:text-red-400 transition-colors w-full text-left">
          {showDanger ? "Hide Danger Zone" : "Danger Zone"}
        </button>
        {showDanger && (
          <div className="mt-3 border border-red-400/20 rounded-lg p-4">
            <p className="text-xs text-red-400/70 mb-3">
              Permanently deletes your profile, reviews, and all booking history. Cannot be undone. Active bookings will be cancelled.
            </p>
            <div className="flex items-center gap-2">
              <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder='Type "DELETE" to confirm'
                className={inputClass + " flex-1 border-red-400/20 focus:border-red-400/40"} />
              <button onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "DELETE" || saving === "delete"}
                className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider bg-red-400/10 text-red-400 rounded-lg hover:bg-red-400/20 transition-colors disabled:opacity-30">
                {saving === "delete" ? "..." : "Delete Account"}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

// ─── Shared Components ──────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 mb-4">
      <h2 className="font-mono text-[10px] text-signal-orange/60 tracking-[3px] uppercase mb-4">{label}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-[10px] font-mono text-aluminum/60 tracking-wider uppercase mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function PrivacyRow({ label, desc, enabled, onToggle }: { label: string; desc: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-t border-ink/[0.03] first:border-0">
      <div>
        <div className="text-xs text-house-lights/70">{label}</div>
        <div className="text-[10px] text-aluminum/35 mt-0.5">{desc}</div>
      </div>
      <Toggle enabled={enabled} onChange={onToggle} />
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
        enabled ? "bg-signal-orange/30" : "bg-ink/[0.12]"
      }`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all ${
        enabled ? "translate-x-4 bg-signal-orange" : "bg-aluminum/40"
      }`} />
    </button>
  );
}

function Btn({ onClick, loading, children }: { onClick: () => void; loading: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider bg-signal-orange/10 text-signal-orange rounded-lg hover:bg-signal-orange/20 transition-colors disabled:opacity-50">
      {loading ? "..." : children}
    </button>
  );
}
