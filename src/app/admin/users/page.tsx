"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type UserRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  user_type: string;
  city: string | null;
  company_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  identity_verified: boolean;
  is_admin: boolean;
  suspended: boolean;
  created_at: string;
  tech_profiles: {
    profile_complete: number;
    completed_gigs: number;
    avg_rating: number | null;
    primary_skill: string | null;
    level: number;
    xp: number;
  } | null;
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name", label: "Name A-Z" },
  { value: "bookings", label: "Most Bookings" },
];

const JOINED_OPTIONS = [
  { value: "", label: "All Time" },
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
];

const PROFILE_OPTIONS = [
  { value: "", label: "All" },
  { value: "complete", label: "Complete (70%+)" },
  { value: "incomplete", label: "Incomplete" },
  { value: "empty", label: "Empty (0%)" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Filters
  const [type, setType] = useState("");
  const [city, setCity] = useState("");
  const [profile, setProfile] = useState("");
  const [joined, setJoined] = useState("");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchUsers = useCallback(async (newOffset: number, append = false) => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (city) params.set("city", city);
    if (profile) params.set("profile", profile);
    if (joined) params.set("joined", joined);
    if (sort) params.set("sort", sort);
    if (search) params.set("search", search);
    params.set("offset", String(newOffset));

    const res = await fetch(`/api/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      const data = await res.json();
      const rows = (data.users || []).map((u: any) => ({
        ...u,
        tech_profiles: Array.isArray(u.tech_profiles) ? u.tech_profiles[0] || null : u.tech_profiles,
      }));
      setUsers(append ? (prev) => [...prev, ...rows] : rows);
      setHasMore(data.hasMore);
      if (data.cities) setCities(data.cities);
    }
    setLoading(false);
  }, [type, city, profile, joined, sort, search]);

  useEffect(() => {
    setOffset(0);
    fetchUsers(0);
  }, [fetchUsers]);

  const loadMore = () => {
    const next = offset + 50;
    setOffset(next);
    fetchUsers(next, true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <div className="p-6 max-w-[1200px]">
      <div className="mb-6">
        <span className="font-mono text-[9px] text-signal-orange tracking-[3px] uppercase">Platform Admin</span>
        <h1 className="font-heading text-xl font-bold tracking-tight mt-1">Users</h1>
      </div>

      {/* Filters */}
      <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, email, company..."
              className="w-full bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights placeholder:text-aluminum/30 focus:outline-none focus:border-signal-orange/30"
            />
          </form>

          {/* Type */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights focus:outline-none focus:border-signal-orange/30"
          >
            <option value="">All Types</option>
            <option value="tech">Techs</option>
            <option value="producer">Producers</option>
          </select>

          {/* City */}
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights focus:outline-none focus:border-signal-orange/30"
          >
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Profile completeness */}
          {type !== "producer" && (
            <select
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              className="bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights focus:outline-none focus:border-signal-orange/30"
            >
              {PROFILE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}

          {/* Joined */}
          <select
            value={joined}
            onChange={(e) => setJoined(e.target.value)}
            className="bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights focus:outline-none focus:border-signal-orange/30"
          >
            {JOINED_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights focus:outline-none focus:border-signal-orange/30"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-ink/[0.06]">
                <th className="text-left px-4 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">Name</th>
                <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">Type</th>
                <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase hidden lg:table-cell">Email</th>
                <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase hidden md:table-cell">City</th>
                <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase hidden xl:table-cell">Company</th>
                <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">Joined</th>
                <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase hidden md:table-cell">Profile %</th>
                <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase hidden lg:table-cell">Bookings</th>
                <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const tp = u.tech_profiles;
                const pct = tp?.profile_complete ?? null;
                return (
                  <tr key={u.id} className="border-b border-ink/[0.03] hover:bg-ink/[0.02] transition-colors">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="flex items-center gap-2.5 text-house-lights hover:text-signal-orange transition-colors"
                      >
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-deep-stage flex items-center justify-center text-[9px] font-mono text-aluminum/40">
                            {(u.display_name || "?")[0]}
                          </div>
                        )}
                        <span className="font-medium truncate max-w-[160px]">{u.display_name || "—"}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider uppercase ${
                        u.user_type === "tech"
                          ? "bg-cue-blue/10 text-cue-blue"
                          : "bg-signal-orange/10 text-signal-orange"
                      }`}>
                        {u.user_type}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-aluminum/60 hidden lg:table-cell truncate max-w-[180px]">{u.email || "—"}</td>
                    <td className="px-3 py-2.5 text-aluminum/60 hidden md:table-cell">{u.city || "—"}</td>
                    <td className="px-3 py-2.5 text-aluminum/60 hidden xl:table-cell truncate max-w-[140px]">{u.company_name || "—"}</td>
                    <td className="px-3 py-2.5 text-aluminum/40 font-mono text-[10px]">{getTimeAgo(u.created_at)}</td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      {pct !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-blackout/50 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pct >= 70 ? "bg-go-green" : pct >= 30 ? "bg-standby-amber" : "bg-signal-orange"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-mono ${
                            pct >= 70 ? "text-go-green" : pct >= 30 ? "text-standby-amber" : "text-signal-orange/70"
                          }`}>{pct}%</span>
                        </div>
                      ) : (
                        <span className="text-aluminum/20">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-aluminum/50 hidden lg:table-cell">
                      {tp?.completed_gigs ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <UserStatus user={u} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !loading && (
          <div className="text-center py-12 text-aluminum/30 text-sm">No users found</div>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <div className="inline-block w-5 h-5 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
          </div>
        )}

        {hasMore && !loading && (
          <div className="flex justify-center py-4 border-t border-ink/[0.03]">
            <button
              onClick={loadMore}
              className="px-4 py-1.5 text-xs font-mono text-aluminum/60 hover:text-signal-orange transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function UserStatus({ user }: { user: UserRow }) {
  if (user.suspended) {
    return <span className="text-[9px] font-mono tracking-wider uppercase text-signal-orange">Suspended</span>;
  }
  if (user.is_admin) {
    return <span className="text-[9px] font-mono tracking-wider uppercase text-signal-orange">Admin</span>;
  }
  if (user.is_verified || user.identity_verified) {
    return <span className="text-[9px] font-mono tracking-wider uppercase text-go-green">Verified</span>;
  }
  const tp = user.tech_profiles;
  if (user.user_type === "tech" && tp && tp.profile_complete === 0) {
    return <span className="text-[9px] font-mono tracking-wider uppercase text-standby-amber">Empty</span>;
  }
  return <span className="text-[9px] font-mono tracking-wider uppercase text-aluminum/40">Active</span>;
}

function getTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
