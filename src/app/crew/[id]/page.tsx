"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function CrewSheet() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [producerName, setProducerName] = useState("");

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }

    const { data: prof } = await supabase.from("profiles").select("display_name, company_name").eq("id", session.user.id).single();
    setProducerName(prof?.company_name || prof?.display_name || "");

    const { data: proj } = await supabase.from("projects").select("*").eq("id", id).single();
    setProject(proj);

    const { data: r } = await supabase.from("project_roles").select("*").eq("project_id", id);
    setRoles(r || []);

    const { data: b } = await supabase.from("bookings")
      .select("*, project_roles(skill)")
      .eq("project_id", id)
      .in("status", ["accepted", "confirmed", "paid", "completed"]);

    // Enrich with tech info
    const enriched = await Promise.all((b || []).map(async (booking: any) => {
      const { data: tech } = await supabase.from("profiles").select("display_name, city, avatar_url").eq("id", booking.tech_id).single();
      const { data: tp } = await supabase.from("tech_profiles").select("primary_skill, hourly_rate").eq("user_id", booking.tech_id).single();
      return { ...booking, tech, techProfile: tp };
    }));

    setBookings(enriched);
    setLoading(false);
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "TBD";

  const handlePrint = () => window.print();

  const totalCost = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const totalFees = bookings.reduce((sum, b) => sum + (b.platform_fee || 0), 0);

  if (loading) return (<div className="min-h-screen flex items-center justify-center"><div className="inline-block w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" /></div>);
  if (!project) return (<div className="min-h-screen flex items-center justify-center text-aluminum">Project not found</div>);

  return (
    <>
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 print:mb-4">
          <div>
            <span className="font-mono text-[10px] text-signal-orange tracking-[3px] uppercase print:text-black">Crew Sheet</span>
            <h1 className="font-heading text-2xl font-bold tracking-tight mt-1 print:text-black">{project.name}</h1>
            <div className="text-xs text-aluminum/65 mt-1 print:text-gray-600">
              {project.city && <span>{project.city}</span>}
              {project.venue && <span> · {project.venue}</span>}
            </div>
          </div>
          <div className="flex gap-2 print:hidden">
            <button onClick={handlePrint}
              className="px-4 py-2 bg-signal-orange text-white text-xs font-heading font-bold tracking-wider uppercase rounded-lg hover:shadow-[0_0_15px_rgba(255,77,0,0.2)] transition-all">
              Print / PDF
            </button>
            <Link href={`/project/${id}`}
              className="px-4 py-2 text-xs font-mono text-aluminum/65 border border-ink/[0.06] rounded-lg hover:border-white/10 transition-all">
              ← Back to Project
            </Link>
          </div>
        </div>

        {/* Print header */}
        <div className="hidden print:flex justify-between items-center mb-4 pb-4 border-b-2 border-gray-300">
          <div>
            <div className="text-2xl font-bold">{project.name}</div>
            <div className="text-sm text-gray-600">{project.city}{project.venue && ` · ${project.venue}`}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold">TRUSS</div>
            <div className="text-xs text-gray-500">trusswork.org</div>
          </div>
        </div>

        {/* Project info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 print:grid-cols-4 print:gap-2 print:mb-4">
          <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-lg p-3 print:bg-gray-50 print:border-gray-200">
            <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase print:text-gray-500">Dates</div>
            <div className="text-sm font-mono mt-1 print:text-black">
              {formatDate(project.start_date)}
              {project.end_date && project.end_date !== project.start_date && ` – ${formatDate(project.end_date)}`}
            </div>
          </div>
          <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-lg p-3 print:bg-gray-50 print:border-gray-200">
            <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase print:text-gray-500">Crew Size</div>
            <div className="text-sm font-mono mt-1 print:text-black">{bookings.length} technicians</div>
          </div>
          <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-lg p-3 print:bg-gray-50 print:border-gray-200">
            <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase print:text-gray-500">Total Labor</div>
            <div className="text-sm font-mono mt-1 print:text-black">${totalCost.toLocaleString()}</div>
          </div>
          <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-lg p-3 print:bg-gray-50 print:border-gray-200">
            <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase print:text-gray-500">Producer</div>
            <div className="text-sm font-mono mt-1 print:text-black">{producerName}</div>
          </div>
        </div>

        {/* Crew by role */}
        {roles.map(role => {
          const roleBookings = bookings.filter(b => b.project_roles?.skill === role.skill);
          return (
            <div key={role.id} className="mb-5 print:mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-heading text-sm font-bold tracking-wider uppercase print:text-black">{role.skill}</span>
                <span className="text-[10px] font-mono text-aluminum/50 print:text-gray-500">
                  {roleBookings.length}/{role.quantity} filled
                </span>
                {roleBookings.length < role.quantity && (
                  <span className="text-[10px] font-mono text-standby-amber/60 print:text-orange-600">
                    {role.quantity - roleBookings.length} needed
                  </span>
                )}
              </div>

              {roleBookings.length > 0 ? (
                <div className="space-y-1">
                  {roleBookings.map(b => (
                    <div key={b.id} className="flex items-center justify-between bg-deep-stage/30 border border-ink/[0.03] rounded-lg px-4 py-3 print:bg-white print:border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="print:hidden">
                          {b.tech?.avatar_url ? (
                            <img src={b.tech.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-ink/[0.05] flex items-center justify-center text-[10px] font-mono text-aluminum/50">
                              {b.tech?.display_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold print:text-black">{b.tech?.display_name}</div>
                          <div className="text-[10px] text-aluminum/50 print:text-gray-500">
                            {b.tech?.city}
                            {b.po_number && <span> · PO: {b.po_number}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm print:text-black">${b.rate}/hr × {b.total_hours}hr</div>
                        <div className="font-mono text-xs text-signal-orange print:text-orange-600">${b.total_amount}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 bg-deep-stage/20 border border-dashed border-ink/[0.06] rounded-lg text-xs text-aluminum/40 italic print:bg-gray-50 print:border-gray-300 print:text-gray-400">
                  No techs booked for this role yet
                </div>
              )}
            </div>
          );
        })}

        {/* Unassigned bookings */}
        {bookings.filter(b => !roles.some(r => r.skill === b.project_roles?.skill)).length > 0 && (
          <div className="mb-5">
            <div className="font-heading text-sm font-bold tracking-wider uppercase mb-2 print:text-black">Other</div>
            {bookings.filter(b => !roles.some(r => r.skill === b.project_roles?.skill)).map(b => (
              <div key={b.id} className="flex items-center justify-between bg-deep-stage/30 border border-ink/[0.03] rounded-lg px-4 py-3 mb-1 print:bg-white print:border-gray-200">
                <div className="text-sm font-semibold print:text-black">{b.tech?.display_name}</div>
                <div className="font-mono text-sm print:text-black">${b.total_amount}</div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 mt-6 print:bg-gray-50 print:border-gray-200">
          <div className="font-mono text-[10px] text-aluminum/50 tracking-wider uppercase mb-3 print:text-gray-500">Cost Summary</div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-aluminum/65 print:text-gray-600">Total Labor</span>
              <span className="font-mono print:text-black">${totalCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-aluminum/65 print:text-gray-600">Platform Fees (10%)</span>
              <span className="font-mono text-aluminum/60 print:text-gray-500">${totalFees.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-ink/[0.04] print:border-gray-300">
              <span className="font-semibold print:text-black">Grand Total</span>
              <span className="font-mono text-lg font-bold text-signal-orange print:text-orange-600">${(totalCost + totalFees).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Print footer */}
        <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-xs text-gray-400 text-center">
          Generated by Truss · trusswork.org · {new Date().toLocaleDateString()}
        </div>
      </main>
    </>
  );
}