"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface BookingModalProps {
  techId: string;
  techName: string;
  techRate: number;
  techSkillRates?: Record<string, number>;
  onClose: () => void;
  onSuccess: () => void;
  prefillProjectId?: string;
  prefillRoleId?: string;
  prefillRate?: number;
  prefillHours?: number;
}

export default function BookingModal({ techId, techName, techRate, techSkillRates, onClose, onSuccess, prefillProjectId, prefillRoleId, prefillRate, prefillHours }: BookingModalProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [hours, setHours] = useState(prefillHours || 10);
  const [rate, setRate] = useState(prefillRate || techRate);
  const [notes, setNotes] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [billingType, setBillingType] = useState("credit_card");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProjects();
    loadBillingType();
  }, []);

  useEffect(() => {
    if (selectedProject) loadRoles(selectedProject);
    else setRoles([]);
  }, [selectedProject]);

  // Auto-select project from prefill
  useEffect(() => {
    if (prefillProjectId && projects.length > 0 && !selectedProject) {
      const match = projects.find(p => p.id === prefillProjectId);
      if (match) setSelectedProject(prefillProjectId);
    }
  }, [projects]);

  // Auto-select role from prefill
  useEffect(() => {
    if (prefillRoleId && roles.length > 0 && !selectedRole) {
      const match = roles.find((r: any) => r.id === prefillRoleId);
      if (match) setSelectedRole(prefillRoleId);
    }
  }, [roles]);

  // Auto-fill rate when role changes
  useEffect(() => {
    if (selectedRole && roles.length > 0 && techSkillRates) {
      const role = roles.find((r: any) => r.id === selectedRole);
      if (role?.skill && techSkillRates[role.skill]) {
        setRate(techSkillRates[role.skill]);
      } else {
        setRate(techRate);
      }
    }
  }, [selectedRole]);

  const loadBillingType = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from("profiles").select("billing_type").eq("id", session.user.id).single();
    if (data?.billing_type) setBillingType(data.billing_type);
  };

  const loadProjects = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("projects")
      .select("*, project_roles(*)")
      .eq("producer_id", session.user.id)
      .in("status", ["draft", "active"])
      .order("created_at", { ascending: false });

    setProjects(data || []);
  };

  const loadRoles = async (projectId: string) => {
    const { data } = await supabase
      .from("project_roles")
      .select("*")
      .eq("project_id", projectId);
    setRoles(data || []);
    if (data && data.length > 0) setSelectedRole(data[0].id);
  };

  const total = rate * hours;
  const fee = Math.round(total * 0.1);

  const sendRequest = async () => {
    if (!selectedProject || !selectedRole) {
      setError("Please select a project and role");
      return;
    }
    setSending(true);
    setError("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: "create",
        projectId: selectedProject,
        projectRoleId: selectedRole,
        techId,
        rate,
        totalHours: hours,
        notes,
        poNumber: poNumber || null,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create booking");
      setSending(false);
      return;
    }

    setSending(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-deep-stage border border-signal-orange/15 rounded-xl p-6 mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-heading text-lg font-bold">
            Book <span className="text-signal-orange">{techName}</span>
          </h2>
          <button onClick={onClose} className="text-aluminum hover:text-house-lights text-lg">✕</button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-sm text-aluminum mb-3">You need a project first</div>
            <a href="/projects" className="text-xs font-mono text-signal-orange hover:underline">
              Create a project →
            </a>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Project *</label>
                <select
                  value={selectedProject}
                  onChange={e => setSelectedProject(e.target.value)}
                  className="w-full px-4 py-3 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none appearance-none"
                >
                  <option value="">Select a project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {p.city || "No location"}</option>
                  ))}
                </select>
              </div>

              {roles.length > 0 && (
                <div>
                  <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Role *</label>
                  <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value)}
                    className="w-full px-4 py-3 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none appearance-none"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.skill} ({r.filled}/{r.quantity} filled)</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Hours</label>
                  <input
                    type="number"
                    value={hours}
                    onChange={e => setHours(parseInt(e.target.value) || 0)}
                    min="1"
                    className="w-full px-4 py-3 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Rate ($/hr)</label>
                  <input
                    type="number"
                    value={rate}
                    onChange={e => setRate(parseInt(e.target.value) || 0)}
                    min="1"
                    className="w-full px-4 py-3 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Special requirements, gear needed, dress code..."
                  rows={3}
                  className="w-full px-4 py-3 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none resize-vertical"
                />
              </div>

              {(billingType === "invoice" || billingType === "prepaid") && (
                <div>
                  <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">
                    PO Number {billingType === "invoice" && <span className="text-signal-orange/50">(recommended)</span>}
                  </label>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={e => setPoNumber(e.target.value)}
                    placeholder="PO-4821"
                    className="w-full px-4 py-3 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none"
                  />
                </div>
              )}
            </div>

            {/* Billing indicator */}
            {billingType !== "credit_card" && (
              <div className="flex items-center gap-2 px-3 py-2 bg-signal-orange/[0.04] border border-signal-orange/10 rounded-lg mb-3">
                <span className="text-[11px] text-aluminum/65">
                  {billingType === "invoice"
                    ? "This booking will be added to your monthly invoice"
                    : "This booking will be deducted from your prepaid balance"
                  }
                </span>
              </div>
            )}

            {/* Cost summary */}
            <div className="bg-blackout rounded-lg p-4 mb-5">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-aluminum">Tech rate</span>
                <span className="font-mono text-sm">${rate}/hr × {hours}hr</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-aluminum">Subtotal</span>
                <span className="font-mono text-sm">${total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-aluminum">Platform fee (10%)</span>
                <span className="font-mono text-xs text-aluminum">+${fee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/5">
                <span className="text-sm font-semibold">Total</span>
                <span className="font-mono text-lg font-semibold text-signal-orange">${(total + fee).toLocaleString()}</span>
              </div>
            </div>

            {error && (
              <div className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 text-aluminum font-heading text-sm tracking-wider uppercase hover:text-house-lights transition-colors">
                Cancel
              </button>
              <button
                onClick={sendRequest}
                disabled={sending || !selectedProject || !selectedRole}
                className="flex-1 py-3 bg-signal-orange text-white font-heading font-semibold text-sm tracking-wider uppercase rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send Booking Request"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}