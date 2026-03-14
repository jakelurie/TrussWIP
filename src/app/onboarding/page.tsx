"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { DEPARTMENTS } from "@/lib/taxonomy";
import CityCombobox from "@/components/CityCombobox";
import Link from "next/link";

// National-average hourly rate ranges by role short name
const RATE_HINTS: Record<string, [number, number]> = {
  A1: [55, 85], A2: [35, 55], MON: [50, 80], DSP: [60, 95],
  V1: [55, 90], V2: [35, 55], GFX: [40, 65], CAM: [40, 70], LED: [45, 70], PROJ: [40, 65],
  L1: [50, 85], L2: [33, 50], SPOT: [28, 40], LP: [55, 90],
  SH: [25, 40], RIG: [45, 75], SM: [50, 80], CARP: [40, 65],
  NET: [60, 100], IT: [35, 55],
  TD: [70, 120], SC: [60, 95], PM: [65, 110],
};

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [userType, setUserType] = useState<"tech" | "producer">("tech");
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");

  // Step 2 (tech)
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [primaryRole, setPrimaryRole] = useState<string | null>(null);

  // Step 2 (producer)
  const [companyName, setCompanyName] = useState("");

  // Step 3 (tech)
  const [hourlyRate, setHourlyRate] = useState("");

  // Step 3 (producer) — city already captured in step 1

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }

    const { data: profile } = await supabase.from("profiles")
      .select("display_name, user_type, city, cities, company_name, roles")
      .eq("id", session.user.id).single();

    if (!profile) { router.push("/login"); return; }

    const uid = session.user.id;
    const type = profile.user_type as "tech" | "producer";

    // Check if this is a returning user adding a second role
    const hasCity = !!(profile.city || profile.cities?.length > 0);
    const isReturningUser = !!(profile.display_name && hasCity);

    if (isReturningUser) {
      if (type === "tech") {
        // Check if tech profile already has primary_skill set
        const { data: tp } = await supabase.from("tech_profiles")
          .select("primary_skill").eq("user_id", uid).single();
        if (tp?.primary_skill) {
          router.push("/dashboard");
          return;
        }
        // Tech needs to pick role — skip to step 2
      } else {
        // Producer returning — skip to step 2 (company name)
        // If they already have company set, they're done
        router.push("/browse");
        return;
      }
    }

    setUserId(uid);
    setUserType(type);
    if (profile.display_name) setDisplayName(profile.display_name);
    if (profile.city) setCity(profile.city);
    if (profile.company_name) setCompanyName(profile.company_name);

    // Skip step 1 if returning user (already has name + city)
    if (isReturningUser) setStep(2);

    setLoading(false);
  };

  const selectedRoleData = primaryRole
    ? DEPARTMENTS.flatMap(d => d.roles).find(r => r.shortName === primaryRole)
    : null;

  const rateHint = primaryRole ? RATE_HINTS[primaryRole] : null;

  const totalSteps = 3;

  const canAdvance = () => {
    if (step === 1) return displayName.trim().length > 0 && city.length > 0;
    if (step === 2 && userType === "tech") return primaryRole !== null;
    if (step === 2 && userType === "producer") return true; // company is optional
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);

    // Update profile
    const profileUpdate: any = {
      display_name: displayName.trim(),
      city,
      cities: [city],
    };
    if (userType === "producer" && companyName.trim()) {
      profileUpdate.company_name = companyName.trim();
    }
    await supabase.from("profiles").update(profileUpdate).eq("id", userId);

    // Update tech profile
    if (userType === "tech" && primaryRole) {
      const techUpdate: any = {
        primary_skill: primaryRole,
        skills: [primaryRole],
      };
      if (hourlyRate) {
        techUpdate.hourly_rate = parseInt(hourlyRate);
        techUpdate.skill_rates = { [primaryRole]: parseInt(hourlyRate) };
      }
      await supabase.from("tech_profiles").update(techUpdate).eq("user_id", userId);
    }

    // Redirect
    if (userType === "tech") {
      router.push(`/profile/${userId}?welcome=true`);
    } else {
      router.push("/browse");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-mono text-sm text-aluminum">Loading...</span>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`h-1 flex-1 rounded-full transition-all ${
                  s <= step ? "bg-signal-orange" : "bg-ink/[0.06]"
                }`}
              />
            </div>
          ))}
          <span className="font-mono text-[10px] text-aluminum ml-1">
            {step}/{totalSteps}
          </span>
        </div>

        {/* ═══ STEP 1: Name + City ═══ */}
        {step === 1 && (
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-wider uppercase mb-2">
              Welcome to <span className="text-signal-orange">Truss</span>
            </h1>
            <p className="text-sm text-aluminum mb-6">
              {userType === "tech"
                ? "Let's set up your profile so producers can find you."
                : "Let's get you set up to find and book crew."}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-signal-orange tracking-wider uppercase mb-1.5">
                  What should we call you?
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-deep-stage border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/30 transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-signal-orange tracking-wider uppercase mb-1.5">
                  Where are you based?
                </label>
                <CityCombobox
                  value={city}
                  onChange={setCity}
                  placeholder="Search for your city..."
                />
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 2 (TECH): Pick department + role ═══ */}
        {step === 2 && userType === "tech" && (
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-wider uppercase mb-2">
              What&apos;s your <span className="text-signal-orange">primary role</span>?
            </h1>
            <p className="text-sm text-aluminum mb-6">
              Pick the one you want to be booked for most. You can add more later.
            </p>

            {!selectedDept ? (
              <div className="grid grid-cols-2 gap-3">
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDept(dept.id)}
                    className="bg-deep-stage border border-white/5 rounded-lg p-4 text-center hover:border-signal-orange/20 transition-all"
                  >
                    <div className="text-2xl mb-2">{dept.icon}</div>
                    <div className="font-heading text-sm font-semibold tracking-wider uppercase">
                      {dept.name}
                    </div>
                    <div className="text-[10px] text-aluminum/60 mt-1">
                      {dept.roles.length} roles
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <button
                  onClick={() => { setSelectedDept(null); setPrimaryRole(null); }}
                  className="text-xs font-mono text-signal-orange hover:underline mb-4 inline-block"
                >
                  ← Back to departments
                </button>
                <div className="space-y-2">
                  {DEPARTMENTS.find((d) => d.id === selectedDept)?.roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setPrimaryRole(role.shortName)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                        primaryRole === role.shortName
                          ? "border-signal-orange/30 bg-signal-orange/[0.06]"
                          : "border-white/5 bg-deep-stage hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-xs text-signal-orange font-bold mr-2">
                            {role.shortName}
                          </span>
                          <span className="text-sm font-semibold">
                            {role.name.replace(` (${role.shortName})`, "")}
                          </span>
                        </div>
                        {primaryRole === role.shortName && (
                          <span className="text-signal-orange text-xs">✓</span>
                        )}
                      </div>
                      <p className="text-[11px] text-aluminum/65 mt-1 leading-relaxed">
                        {role.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 2 (PRODUCER): Company ═══ */}
        {step === 2 && userType === "producer" && (
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-wider uppercase mb-2">
              What&apos;s your <span className="text-signal-orange">company</span>?
            </h1>
            <p className="text-sm text-aluminum mb-6">
              Optional — helps techs know who they&apos;re working for.
            </p>

            <div>
              <label className="block text-xs font-mono text-signal-orange tracking-wider uppercase mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Encore, PSAV, your company..."
                className="w-full px-4 py-3 bg-deep-stage border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/30 transition-colors"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* ═══ STEP 3 (TECH): Rate ═══ */}
        {step === 3 && userType === "tech" && (
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-wider uppercase mb-2">
              Set your <span className="text-signal-orange">rate</span>
            </h1>
            <p className="text-sm text-aluminum mb-6">
              Your hourly rate for{" "}
              <span className="text-house-lights font-semibold">
                {selectedRoleData?.name || primaryRole}
              </span>
              . You can adjust this anytime.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-mono text-signal-orange tracking-wider uppercase mb-1.5">
                Hourly Rate (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-aluminum text-sm">$</span>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder={rateHint ? `${rateHint[0]}` : "50"}
                  className="w-full pl-8 pr-4 py-3 bg-deep-stage border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/30 transition-colors"
                  autoFocus
                  min="1"
                />
              </div>
            </div>

            {rateHint && (
              <div className="bg-deep-stage border border-white/5 rounded-lg px-4 py-3">
                <div className="font-mono text-[10px] text-aluminum/65 tracking-wider uppercase mb-1">
                  Market range for {primaryRole}
                </div>
                <div className="font-mono text-sm text-house-lights">
                  ${rateHint[0]} – ${rateHint[1]}/hr
                </div>
                <div className="text-[10px] text-aluminum/50 mt-1">
                  National average for corporate events.{" "}
                  <Link href="/rates" target="_blank" className="text-signal-orange/50 hover:text-signal-orange transition-colors">
                    Full rate guide →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 3 (PRODUCER): Event city ═══ */}
        {step === 3 && userType === "producer" && (
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-wider uppercase mb-2">
              Where do you <span className="text-signal-orange">produce events</span>?
            </h1>
            <p className="text-sm text-aluminum mb-6">
              We&apos;ll prioritize showing you techs in your market. You can search any city later.
            </p>

            <div className="bg-deep-stage border border-white/5 rounded-lg px-4 py-3">
              <div className="font-mono text-[10px] text-aluminum/65 tracking-wider uppercase mb-1">
                Your city
              </div>
              <div className="text-sm text-house-lights">{city || "Not set"}</div>
              <div className="text-[10px] text-aluminum/50 mt-1">
                Set in step 1. You can browse techs in any city from the marketplace.
              </div>
            </div>
          </div>
        )}

        {/* ═══ Navigation ═══ */}
        <div className="flex items-center justify-between mt-8">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-sm font-mono text-aluminum hover:text-house-lights transition-colors"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance()}
              className="px-6 py-2.5 bg-signal-orange text-white font-heading font-semibold text-sm tracking-wider uppercase rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="px-6 py-2.5 bg-signal-orange text-white font-heading font-semibold text-sm tracking-wider uppercase rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Finish"}
            </button>
          )}
        </div>

        {/* Skip link */}
        {step === 3 && (
          <div className="text-center mt-4">
            <button
              onClick={handleFinish}
              className="text-xs text-aluminum/60 hover:text-aluminum transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
