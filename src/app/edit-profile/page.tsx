"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { DEPARTMENTS, getAllRoles, getSpecializationsForRoles, CERTIFICATIONS } from "@/lib/taxonomy";
import CityMultiSelect from "@/components/CityMultiSelect";

export default function EditProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [techProfileId, setTechProfileId] = useState<string | null>(null);

  // Profile fields
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [primarySkill, setPrimarySkill] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [gear, setGear] = useState("");
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [skillRates, setSkillRates] = useState<Record<string, number>>({});
  const [available, setAvailable] = useState(true);
  const [hasInsurance, setHasInsurance] = useState(false);
  const [insuranceType, setInsuranceType] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [cancellationPolicy, setCancellationPolicy] = useState("flexible");
  const [careerHighlights, setCareerHighlights] = useState<{ title: string; year: string; description: string }[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [certSearch, setCertSearch] = useState("");
  const [certDropdownOpen, setCertDropdownOpen] = useState(false);

  // Progressive disclosure toggles (collapsed by default, auto-expand when data exists)
  const [showSpecs, setShowSpecs] = useState(false);
  const [showSkillRates, setShowSkillRates] = useState(false);
  const [showGear, setShowGear] = useState(false);
  const [showBio, setShowBio] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [showInsurance, setShowInsurance] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [showCerts, setShowCerts] = useState(false);

  // Calculate profile completeness
  const calcComplete = () => {
    let score = 0;
    if (avatarUrl) score += 15;
    if (displayName) score += 10;
    if (cities.length > 0) score += 10;
    if (primarySkill) score += 10;
    if (skills.length > 0) score += 5;
    if (bio && bio.length > 20) score += 15;
    if (gear.trim().length > 0) score += 10;
    if (yearsExperience > 0) score += 10;
    if (hourlyRate > 0) score += 10;
    if (specializations.length > 0) score += 5;
    if (certifications.length > 0) score += 5;
    return Math.min(100, score);
  };

  const completeness = calcComplete();

  // Specific prompts for missing items
  const missingPrompts: { label: string; pct: string }[] = [];
  if (!avatarUrl) missingPrompts.push({ label: "Add a photo", pct: "+15%" });
  if (!bio || bio.length <= 20) missingPrompts.push({ label: "Write a bio", pct: "+15%" });
  if (!gear.trim()) missingPrompts.push({ label: "Add gear & equipment", pct: "+10%" });
  if (yearsExperience <= 0) missingPrompts.push({ label: "Add years of experience", pct: "+10%" });
  if (hourlyRate <= 0) missingPrompts.push({ label: "Set your hourly rate", pct: "+10%" });
  if (specializations.length === 0 && skills.length > 0) missingPrompts.push({ label: "Add specializations", pct: "+5%" });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }

    setUserId(session.user.id);

    // Load profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profile) {
      setDisplayName(profile.display_name || "");
      setAvatarUrl(profile.avatar_url || "");
      // Load cities array, fallback to single city for pre-migration users
      const loadedCities = profile.cities?.length > 0
        ? profile.cities
        : profile.city ? [profile.city] : [];
      setCities(loadedCities);
      setPhone(profile.phone || "");
    }

    // Load tech profile
    const { data: techProfile } = await supabase
      .from("tech_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (techProfile) {
      setTechProfileId(techProfile.id);
      setPrimarySkill(techProfile.primary_skill || "");
      setSkills(techProfile.skills || []);
      setSpecializations(techProfile.specializations || []);
      // gear may be old array format or new string
      const rawGear = techProfile.gear;
      if (Array.isArray(rawGear)) {
        setGear(rawGear.join(", "));
      } else {
        setGear(rawGear || "");
      }
      setBio(techProfile.bio || "");
      setYearsExperience(techProfile.years_experience || 0);
      setHourlyRate(techProfile.hourly_rate || 0);
      setSkillRates(techProfile.skill_rates || {});
      setAvailable(techProfile.available ?? true);
      setHasInsurance(techProfile.has_insurance || false);
      setInsuranceType(techProfile.insurance_type || "");
      setInsuranceProvider(techProfile.insurance_provider || "");
      setLinkedinUrl(techProfile.linkedin_url || "");
      setWebsiteUrl(techProfile.website_url || "");
      setCancellationPolicy(techProfile.cancellation_policy || "flexible");
      setCareerHighlights(techProfile.career_highlights || []);
      setCertifications(techProfile.certifications || []);

      // Auto-expand sections that already have data
      if (techProfile.specializations?.length > 0) setShowSpecs(true);
      if (Object.keys(techProfile.skill_rates || {}).length > 0) setShowSkillRates(true);
      if (techProfile.gear || (Array.isArray(techProfile.gear) && techProfile.gear.length > 0)) setShowGear(true);
      if (techProfile.bio && techProfile.bio.length > 0) setShowBio(true);
      if (techProfile.linkedin_url || techProfile.website_url) setShowLinks(true);
      if (techProfile.has_insurance) setShowInsurance(true);
      if (techProfile.cancellation_policy && techProfile.cancellation_policy !== "flexible") setShowCancellation(true);
      if (techProfile.career_highlights?.length > 0) setShowHighlights(true);
      if (techProfile.certifications?.length > 0) setShowCerts(true);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setSaved(false);
    setSaveError("");

    const gearItems = gear
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const { data: profileRow, error: profileError } = await supabase.from("profiles").update({
      display_name: displayName,
      avatar_url: avatarUrl || null,
      city: cities[0] || "",
      cities: cities,
      phone: phone || null,
    }).eq("id", userId).select("id").maybeSingle();

    if (profileError) {
      setSaveError(profileError.message);
      setSaving(false);
      return;
    }

    if (!profileRow) {
      setSaveError("Profile record was not found. Please refresh and try again.");
      setSaving(false);
      return;
    }

    const { error: techError } = await supabase.from("tech_profiles").upsert({
      user_id: userId,
      primary_skill: primarySkill,
      skills: skills,
      specializations: specializations,
      gear: gearItems,
      bio: bio,
      years_experience: yearsExperience,
      hourly_rate: hourlyRate,
      skill_rates: skillRates,
      available: available,
      has_insurance: hasInsurance,
      insurance_type: insuranceType || null,
      insurance_provider: insuranceProvider || null,
      linkedin_url: linkedinUrl || null,
      website_url: websiteUrl || null,
      cancellation_policy: cancellationPolicy,
      career_highlights: careerHighlights.filter(h => h.title.trim()),
      certifications: certifications,
    }, { onConflict: "user_id" });

    if (techError) {
      setSaveError(techError.message);
      setSaving(false);
      return;
    }

    if (!techProfileId) {
      setTechProfileId(userId);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleChip = (item: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(item)) setList(list.filter(i => i !== item));
    else setList([...list, item]);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploadingAvatar(true);

    const ext = file.name.split(".").pop();
    const path = `avatars/${userId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      setUploadingAvatar(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(publicUrl + "?t=" + Date.now());
    setUploadingAvatar(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-mono text-sm text-aluminum">Loading profile...</span>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-wider uppercase mb-1">
              Edit <span className="text-signal-orange">Profile</span>
            </h1>
            <p className="text-sm text-aluminum">Complete your profile to get discovered by producers</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 bg-signal-orange text-white font-heading font-semibold text-sm tracking-wider uppercase rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save Profile"}
          </button>
        </div>

        {saveError && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-400">
            {saveError}
          </div>
        )}

        {/* Completeness bar */}
        <div className="bg-deep-stage border border-white/5 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-mono text-xs text-aluminum">PROFILE COMPLETENESS</span>
            <span className="font-mono text-sm font-semibold" style={{ color: completeness >= 80 ? "var(--color-go-green)" : completeness >= 50 ? "var(--color-standby-amber)" : "var(--color-signal-orange)" }}>
              {completeness}%
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${completeness}%`,
                background: completeness >= 80 ? "var(--color-go-green)" : completeness >= 50 ? "var(--color-standby-amber)" : "var(--color-signal-orange)",
              }}
            />
          </div>
          {missingPrompts.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {missingPrompts.slice(0, 4).map((p) => (
                <span key={p.label} className="px-2.5 py-1 bg-blackout rounded text-[11px] text-aluminum/60">
                  {p.label} <span className="text-signal-orange/60 font-mono">{p.pct}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Basic Info */}
        <section className="bg-deep-stage border border-white/5 rounded-lg p-5 mb-4">
          <h2 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange mb-4">Basic Info</h2>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center font-heading text-lg font-bold text-aluminum/50">
                  {displayName ? displayName.split(" ").map(n => n[0]).join("").toUpperCase() : "?"}
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <label className="px-4 py-2 bg-ink/[0.03] border border-ink/[0.06] rounded-lg text-xs font-mono text-aluminum hover:border-signal-orange/20 hover:text-signal-orange transition-all cursor-pointer inline-block">
                {avatarUrl ? "Change Photo" : "Upload Photo"}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
              {avatarUrl && (
                <button onClick={() => setAvatarUrl("")} className="ml-2 text-[10px] text-aluminum/50 hover:text-red-400 transition-colors">
                  Remove
                </button>
              )}
              <p className="text-[10px] text-aluminum/40 mt-1">JPG, PNG. Shows on your profile and browse page.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Display Name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Marcus Rodriguez"
                className="w-full px-4 py-3 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/30 transition-colors"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Cities</label>
              <CityMultiSelect cities={cities} onChange={setCities} />
            </div>
            <div>
              <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Years of Experience</label>
              <input
                type="number"
                value={yearsExperience || ""}
                onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
                placeholder="12"
                min="0"
                className="w-full px-4 py-3 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Default Hourly Rate ($)</label>
              <input
                type="number"
                value={hourlyRate || ""}
                onChange={(e) => setHourlyRate(parseInt(e.target.value) || 0)}
                placeholder="75"
                min="0"
                className="w-full px-4 py-3 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/30 transition-colors"
              />
            </div>
          </div>

          {/* Per-skill rates */}
          {skills.length >= 2 && (
            <div className="mt-4">
              {!showSkillRates ? (
                <button onClick={() => setShowSkillRates(true)} className="text-xs font-mono text-signal-orange/60 hover:text-signal-orange transition-colors">
                  + Set different rates per role
                </button>
              ) : (
              <>
              <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-2">Rate Per Position</label>
              <p className="text-[11px] text-aluminum/60 mb-3">Set different rates for each role. Leave blank to use your default rate.</p>
              <div className="space-y-2">
                {skills.map(skill => (
                  <div key={skill} className="flex items-center gap-3 bg-blackout/50 rounded-lg p-2.5">
                    <span className={`text-xs font-mono w-32 flex-shrink-0 ${primarySkill === skill ? "text-signal-orange font-bold" : "text-aluminum"}`}>
                      {primarySkill === skill && "★ "}{skill}
                    </span>
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-aluminum/50 text-xs">$</span>
                      <input
                        type="number"
                        value={skillRates[skill] || ""}
                        onChange={(e) => setSkillRates({ ...skillRates, [skill]: parseInt(e.target.value) || 0 })}
                        placeholder={hourlyRate ? `${hourlyRate}` : "—"}
                        min="0"
                        className="w-20 px-2 py-1.5 bg-deep-stage border border-ink/[0.06] rounded text-house-lights text-sm font-mono outline-none focus:border-signal-orange/20 transition-colors text-center"
                      />
                      <span className="text-aluminum/50 text-xs">/hr</span>
                    </div>
                    {skillRates[skill] && skillRates[skill] !== hourlyRate ? (
                      <span className="text-[9px] font-mono text-signal-orange/50">custom</span>
                    ) : (
                      <span className="text-[9px] font-mono text-aluminum/35">default</span>
                    )}
                  </div>
                ))}
              </div>
              </>
              )}
            </div>
          )}
          <div className="mt-4 flex items-center gap-3">
            <label className="block text-xs font-mono text-aluminum tracking-wider uppercase">Available for Bookings</label>
            <button
              onClick={() => setAvailable(!available)}
              className={`w-10 h-5 rounded-full transition-colors relative ${available ? "bg-go-green" : "bg-white/10"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${available ? "left-5" : "left-0.5"}`} />
            </button>
            <span className="text-xs font-mono" style={{ color: available ? "var(--color-go-green)" : "var(--color-aluminum)" }}>
              {available ? "Available" : "Unavailable"}
            </span>
          </div>
        </section>

        {/* Skills & Roles */}
        <section className="bg-deep-stage border border-white/5 rounded-lg p-5 mb-4">
          <h2 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange mb-2">Roles & Specializations</h2>
          <p className="text-xs text-aluminum mb-4">Select your roles by department. Click a selected role to set it as primary.</p>

          <div className="space-y-2 mb-4">
            {DEPARTMENTS.map(dept => {
              const deptRoleIds = dept.roles.map(r => r.shortName);
              const selectedInDept = skills.filter(s => deptRoleIds.includes(s));
              const isExpanded = expandedDept === dept.id;

              return (
                <div key={dept.id} className="border border-ink/[0.04] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedDept(isExpanded ? null : dept.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-ink/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{dept.icon}</span>
                      <span className="font-heading text-sm font-semibold tracking-wide">{dept.name}</span>
                      {selectedInDept.length > 0 && (
                        <span className="px-2 py-0.5 bg-signal-orange/10 text-signal-orange text-[10px] font-mono rounded">
                          {selectedInDept.length}
                        </span>
                      )}
                    </div>
                    <span className="text-aluminum/50 text-xs">{isExpanded ? "▲" : "▼"}</span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {dept.roles.map(role => {
                        const selected = skills.includes(role.shortName);
                        const isPrimary = primarySkill === role.shortName;
                        return (
                          <div key={role.id}>
                            <button
                              onClick={() => {
                                if (isPrimary) {
                                  setPrimarySkill("");
                                  toggleChip(role.shortName, skills, setSkills);
                                } else if (selected) {
                                  setPrimarySkill(role.shortName);
                                } else {
                                  toggleChip(role.shortName, skills, setSkills);
                                }
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-left ${
                                isPrimary
                                  ? "bg-signal-orange/15 border border-signal-orange/40"
                                  : selected
                                  ? "bg-signal-orange/5 border border-signal-orange/20"
                                  : "bg-blackout/30 border border-ink/[0.04] hover:border-white/10"
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`font-mono text-xs font-bold ${isPrimary ? "text-signal-orange" : selected ? "text-signal-orange/70" : "text-aluminum/65"}`}>
                                    {role.shortName}
                                  </span>
                                  <span className={`text-sm ${selected ? "text-house-lights" : "text-aluminum/60"}`}>
                                    {role.name}
                                  </span>
                                  {isPrimary && <span className="px-1.5 py-0.5 bg-signal-orange text-white text-[8px] font-mono rounded">PRIMARY</span>}
                                </div>
                                <p className="text-[10px] text-aluminum/50 mt-0.5">{role.description}</p>
                              </div>
                              <div className="flex-shrink-0 ml-2">
                                {selected ? (
                                  <span className="text-signal-orange text-sm">✓</span>
                                ) : (
                                  <span className="text-aluminum/30 text-sm">+</span>
                                )}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected roles summary */}
          {skills.length > 0 && (
            <div className="mb-4">
              <label className="block text-[10px] font-mono text-aluminum/50 tracking-wider uppercase mb-2">Your Roles ({skills.length})</label>
              <div className="flex flex-wrap gap-1.5">
                {skills.map(skill => {
                  const isPrimary = primarySkill === skill;
                  return (
                    <button
                      key={skill}
                      onClick={() => {
                        if (isPrimary) setPrimarySkill("");
                        setSkills(skills.filter(s => s !== skill));
                        const newRates = { ...skillRates };
                        delete newRates[skill];
                        setSkillRates(newRates);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                        isPrimary
                          ? "bg-signal-orange text-white hover:bg-red-500"
                          : "bg-signal-orange/10 text-signal-orange border border-signal-orange/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                      }`}
                    >
                      {isPrimary && "★ "}{skill} ✕
                    </button>
                  );
                })}
              </div>
              {!primarySkill && skills.length > 0 && (
                <p className="text-[10px] text-standby-amber mt-2">Click a selected role above to set it as your primary.</p>
              )}
            </div>
          )}

          {/* Specializations */}
          {skills.length > 0 && (() => {
            const allRoles = getAllRoles();
            const selectedRoleIds = allRoles.filter(r => skills.includes(r.shortName)).map(r => r.id);
            const availableSpecs = getSpecializationsForRoles(selectedRoleIds);
            if (availableSpecs.length === 0) return null;
            return (
              <div>
                {!showSpecs && specializations.length === 0 ? (
                  <button onClick={() => setShowSpecs(true)} className="text-xs font-mono text-signal-orange/60 hover:text-signal-orange transition-colors">
                    + Add specializations ({availableSpecs.length} available)
                  </button>
                ) : (
                <>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-mono text-aluminum tracking-wider uppercase">Specializations</label>
                  {specializations.length > 0 && (
                    <span className="text-[10px] font-mono text-signal-orange/50">{specializations.length} selected</span>
                  )}
                </div>
                <p className="text-[10px] text-aluminum/60 mb-3">What are you specifically great at? These help producers find the right person.</p>
                <div className="flex flex-wrap gap-1.5">
                  {availableSpecs.map(spec => {
                    const selected = specializations.includes(spec);
                    return (
                      <button
                        key={spec}
                        onClick={() => toggleChip(spec, specializations, setSpecializations)}
                        className={`px-2.5 py-1.5 rounded text-[11px] font-mono transition-all ${
                          selected
                            ? "bg-cue-blue/15 text-cue-blue border border-cue-blue/30"
                            : "bg-ink/[0.02] text-aluminum/60 border border-ink/[0.06] hover:border-white/10"
                        }`}
                      >
                        {spec}
                      </button>
                    );
                  })}
                </div>
                </>
                )}
              </div>
            );
          })()}
        </section>

        {/* Gear & Equipment */}
        <section className="bg-deep-stage border border-white/5 rounded-lg mb-4">
          <button onClick={() => setShowGear(!showGear)} className="w-full flex items-center justify-between p-5">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange">Gear & Equipment</h2>
              {gear.trim() ? (
                <span className="text-[10px] font-mono text-go-green bg-go-green/10 px-1.5 py-0.5 rounded">Added</span>
              ) : (
                <span className="text-[10px] font-mono text-standby-amber bg-standby-amber/10 px-1.5 py-0.5 rounded">+10%</span>
              )}
            </div>
            <span className="text-aluminum/50 text-xs">{showGear ? "▲" : "▼"}</span>
          </button>
          {showGear && (
            <div className="px-5 pb-5">
              <p className="text-xs text-aluminum mb-3">List the gear you own or are proficient with. Helps producers match you to their tech rider.</p>
              <textarea
                value={gear}
                onChange={e => setGear(e.target.value)}
                placeholder="e.g., Yamaha CL5, DiGiCo SD12, Shure Axient Digital, Dante certified, own Sennheiser G4 IEM kit, PTZ camera operator (Sony SRG series)..."
                rows={4}
                className="w-full px-4 py-3 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/30 transition-colors resize-y leading-relaxed"
              />
            </div>
          )}
        </section>

        {/* Bio */}
        <section className="bg-deep-stage border border-white/5 rounded-lg mb-4">
          <button onClick={() => setShowBio(!showBio)} className="w-full flex items-center justify-between p-5">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange">Bio</h2>
              {bio && bio.length > 20 ? (
                <span className="text-[10px] font-mono text-go-green bg-go-green/10 px-1.5 py-0.5 rounded">Added</span>
              ) : (
                <span className="text-[10px] font-mono text-standby-amber bg-standby-amber/10 px-1.5 py-0.5 rounded">+15%</span>
              )}
            </div>
            <span className="text-aluminum/50 text-xs">{showBio ? "▲" : "▼"}</span>
          </button>
          {showBio && (
            <div className="px-5 pb-5">
              <p className="text-xs text-aluminum mb-4">Tell producers why they should book you</p>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="12 years in corporate AV. Specializing in A1 work for conferences, galas, and large-format events. Calm under pressure, clean signal flow..."
                rows={5}
                className="w-full px-4 py-3 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/30 transition-colors resize-vertical leading-relaxed"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-aluminum">{bio.length} characters</span>
                {bio.length > 0 && bio.length < 50 && (
                  <span className="text-xs text-standby-amber">A longer bio helps you stand out</span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Links */}
        <section className="bg-deep-stage border border-white/5 rounded-lg mb-4">
          <button onClick={() => setShowLinks(!showLinks)} className="w-full flex items-center justify-between p-5">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange">Links</h2>
              {(linkedinUrl || websiteUrl) && (
                <span className="text-[10px] font-mono text-go-green bg-go-green/10 px-1.5 py-0.5 rounded">Added</span>
              )}
            </div>
            <span className="text-aluminum/50 text-xs">{showLinks ? "▲" : "▼"}</span>
          </button>
          {showLinks && (
            <div className="px-5 pb-5">
              <p className="text-xs text-aluminum mb-4">Add your LinkedIn or personal website so producers can learn more about you</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">LinkedIn</label>
                  <input
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourname"
                    className="w-full px-4 py-3 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Website / Portfolio</label>
                  <input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yoursite.com"
                    className="w-full px-4 py-3 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/30 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Cancellation Policy */}
        <section className="bg-deep-stage border border-white/5 rounded-lg mb-4">
          <button
            onClick={() => setShowCancellation(!showCancellation)}
            className="w-full flex items-center justify-between p-5"
          >
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange">Cancellation Policy</h2>
              {cancellationPolicy !== "flexible" && (
                <span className="text-[10px] font-mono text-go-green bg-go-green/10 px-1.5 py-0.5 rounded">Set</span>
              )}
            </div>
            <span className="text-aluminum/50 text-xs">{showCancellation ? "▲" : "▼"}</span>
          </button>
          {showCancellation && (
          <div className="px-5 pb-5">
          <p className="text-xs text-aluminum mb-4">Set your cancellation terms. Producers will see this on your profile.</p>
          <div className="space-y-2">
            {[
              { id: "flexible", label: "Flexible", desc: "Free cancellation anytime before the gig starts" },
              { id: "24hr", label: "24-Hour Notice", desc: "Free cancellation up to 24 hours before the gig" },
              { id: "48hr", label: "48-Hour Notice", desc: "Free cancellation up to 48 hours before the gig" },
              { id: "72hr", label: "72-Hour Notice", desc: "Free cancellation up to 72 hours before the gig" },
            ].map(opt => (
              <button key={opt.id} type="button" onClick={() => setCancellationPolicy(opt.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3 ${
                  cancellationPolicy === opt.id
                    ? "border-signal-orange/30 bg-signal-orange/[0.04]"
                    : "border-ink/[0.04] hover:border-white/10"
                }`}>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{opt.label}</div>
                  <div className="text-[11px] text-aluminum/60 leading-relaxed">{opt.desc}</div>
                </div>
                {cancellationPolicy === opt.id && <span className="text-signal-orange text-xs mt-1">✓</span>}
              </button>
            ))}
          </div>
          </div>
          )}
        </section>

        {/* Insurance & Certifications */}
        <section className="bg-deep-stage border border-white/5 rounded-lg mb-4">
          <button
            onClick={() => setShowInsurance(!showInsurance)}
            className="w-full flex items-center justify-between p-5"
          >
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange">Insurance & Certifications</h2>
              {hasInsurance && <span className="text-[10px] font-mono text-go-green bg-go-green/10 px-1.5 py-0.5 rounded">Insured</span>}
            </div>
            <span className="text-aluminum/50 text-xs">{showInsurance ? "▲" : "▼"}</span>
          </button>
          {showInsurance && (
          <div className="px-5 pb-5">
          <p className="text-xs text-aluminum mb-4">Enterprise producers often require proof of insurance. Having coverage makes you more bookable.</p>

          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setHasInsurance(!hasInsurance)}
              className={`relative w-11 h-6 rounded-full transition-colors ${hasInsurance ? "bg-go-green" : "bg-white/10"}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${hasInsurance ? "translate-x-[22px]" : "translate-x-0.5"}`} />
            </button>
            <span className="text-sm">I carry general liability insurance</span>
          </div>

          {hasInsurance && (
            <div className="space-y-3 pl-14">
              <div>
                <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Coverage Type</label>
                <select
                  value={insuranceType}
                  onChange={e => setInsuranceType(e.target.value)}
                  className="w-full px-4 py-3 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none appearance-none"
                >
                  <option value="">Select type</option>
                  <option value="general_liability">General Liability</option>
                  <option value="general_and_professional">General Liability + Professional</option>
                  <option value="workers_comp">Workers&apos; Compensation</option>
                  <option value="full_coverage">Full Coverage (GL + Professional + WC)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">
                  Provider <span className="text-aluminum/50">(optional)</span>
                </label>
                <input
                  type="text"
                  value={insuranceProvider}
                  onChange={e => setInsuranceProvider(e.target.value)}
                  placeholder="e.g. Thimble, Next Insurance, IATSE..."
                  className="w-full px-4 py-3 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/30 transition-colors"
                />
              </div>
              <div className="bg-signal-orange/[0.03] border border-signal-orange/10 rounded-lg p-3">
                <p className="text-[11px] text-aluminum/60 leading-relaxed">
                  Your insurance status will be displayed on your profile. Producers can filter for insured techs. We don&apos;t verify coverage — be prepared to provide proof of insurance if requested.
                </p>
              </div>
            </div>
          )}
          </div>
          )}
        </section>

        {/* Career Highlights */}
        <section className="bg-deep-stage border border-white/5 rounded-lg mb-4">
          <button
            onClick={() => setShowHighlights(!showHighlights)}
            className="w-full flex items-center justify-between p-5"
          >
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange">Career Highlights</h2>
              {careerHighlights.length > 0 && <span className="text-[10px] font-mono text-aluminum/50">{careerHighlights.length}</span>}
            </div>
            <span className="text-aluminum/50 text-xs">{showHighlights ? "▲" : "▼"}</span>
          </button>
          {showHighlights && (
          <div className="px-5 pb-5">
            <p className="text-xs text-aluminum mb-4">Add up to 10 notable credits, achievements, or career milestones. These appear on your public profile.</p>

            {careerHighlights.map((h, i) => (
              <div key={i} className="flex gap-3 items-start bg-blackout rounded-lg p-3 mb-2">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={h.title}
                      onChange={e => {
                        const updated = [...careerHighlights];
                        updated[i] = { ...updated[i], title: e.target.value };
                        setCareerHighlights(updated);
                      }}
                      placeholder="e.g. CES 2025 Main Stage A1"
                      className="flex-1 px-3 py-2 bg-deep-stage border border-white/5 rounded text-sm text-house-lights outline-none focus:border-signal-orange/20"
                    />
                    <input
                      value={h.year}
                      onChange={e => {
                        const updated = [...careerHighlights];
                        updated[i] = { ...updated[i], year: e.target.value };
                        setCareerHighlights(updated);
                      }}
                      placeholder="2025"
                      className="w-20 px-3 py-2 bg-deep-stage border border-white/5 rounded text-sm text-house-lights text-center outline-none focus:border-signal-orange/20"
                    />
                  </div>
                  <input
                    value={h.description}
                    onChange={e => {
                      const updated = [...careerHighlights];
                      updated[i] = { ...updated[i], description: e.target.value };
                      setCareerHighlights(updated);
                    }}
                    placeholder="Short description (optional)"
                    className="w-full px-3 py-2 bg-deep-stage border border-white/5 rounded text-sm text-house-lights outline-none focus:border-signal-orange/20"
                  />
                </div>
                <button
                  onClick={() => setCareerHighlights(careerHighlights.filter((_, idx) => idx !== i))}
                  className="text-red-400 hover:text-red-300 text-sm px-2 mt-2"
                >
                  ✕
                </button>
              </div>
            ))}

            {careerHighlights.length < 10 && (
              <button
                onClick={() => setCareerHighlights([...careerHighlights, { title: "", year: "", description: "" }])}
                className="text-xs font-mono text-signal-orange hover:underline mt-2"
              >
                + Add Highlight
              </button>
            )}
          </div>
          )}
        </section>

        {/* Certifications */}
        <section className="bg-deep-stage border border-white/5 rounded-lg mb-4">
          <button
            onClick={() => setShowCerts(!showCerts)}
            className="w-full flex items-center justify-between p-5"
          >
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange">Certifications</h2>
              {certifications.length > 0 && <span className="text-[10px] font-mono text-aluminum/50">{certifications.length}</span>}
            </div>
            <span className="text-aluminum/50 text-xs">{showCerts ? "▲" : "▼"}</span>
          </button>
          {showCerts && (
          <div className="px-5 pb-5">
            <p className="text-xs text-aluminum mb-4">Select certifications you hold, or type a custom one and press Enter.</p>

            {/* Selected certs */}
            {certifications.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {certifications.map(cert => (
                  <span key={cert} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-signal-orange/10 text-signal-orange border border-signal-orange/25">
                    {cert}
                    <button onClick={() => setCertifications(certifications.filter(c => c !== cert))} className="text-signal-orange/50 hover:text-signal-orange text-[10px]">✕</button>
                  </span>
                ))}
              </div>
            )}

            {/* Search / add input */}
            <div className="relative">
              <input
                value={certSearch}
                onChange={e => { setCertSearch(e.target.value); setCertDropdownOpen(true); }}
                onFocus={() => setCertDropdownOpen(true)}
                onKeyDown={e => {
                  if (e.key === "Enter" && certSearch.trim()) {
                    e.preventDefault();
                    if (!certifications.includes(certSearch.trim())) {
                      setCertifications([...certifications, certSearch.trim()]);
                    }
                    setCertSearch("");
                    setCertDropdownOpen(false);
                  }
                }}
                placeholder="Search certifications or type your own..."
                className="w-full px-3 py-2 bg-blackout border border-ink/[0.08] rounded-lg text-sm text-house-lights placeholder:text-aluminum/40 outline-none focus:border-signal-orange/20"
              />
              {certDropdownOpen && certSearch.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-blackout border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
                  {CERTIFICATIONS
                    .filter(c => c.toLowerCase().includes(certSearch.toLowerCase()) && !certifications.includes(c))
                    .map(c => (
                      <button
                        key={c}
                        onClick={() => {
                          setCertifications([...certifications, c]);
                          setCertSearch("");
                          setCertDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-house-lights/70 hover:bg-ink/[0.03] transition-colors"
                      >
                        {c}
                      </button>
                    ))}
                  {CERTIFICATIONS.filter(c => c.toLowerCase().includes(certSearch.toLowerCase()) && !certifications.includes(c)).length === 0 && (
                    <div className="px-3 py-2 text-xs text-aluminum/50 font-mono">
                      Press Enter to add &ldquo;{certSearch}&rdquo;
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick-pick common certs */}
            {certifications.length === 0 && !certSearch && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {CERTIFICATIONS.slice(0, 12).map(c => (
                  <button
                    key={c}
                    onClick={() => setCertifications([...certifications, c])}
                    className="px-2.5 py-1 rounded-md text-[10px] font-mono bg-blackout text-aluminum/60 border border-ink/[0.06] hover:border-white/15 hover:text-aluminum transition-all"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
          )}
        </section>

        {/* Save */}
        <div className="flex justify-between items-center mt-6 mb-12">
          <div className="text-xs text-aluminum">
            {saved && <span className="text-go-green font-mono">✓ Profile saved successfully</span>}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-signal-orange text-white font-heading font-semibold text-sm tracking-wider uppercase rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
    </main>
  );
}
