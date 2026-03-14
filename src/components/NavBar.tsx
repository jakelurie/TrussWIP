"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import NotificationBell from "./NotificationBell";

const HIDDEN_ROUTES = ["/onboarding"];

function NavLink({ href, children, pathname }: { href: string; children: React.ReactNode; pathname: string }) {
  const isActive = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`relative px-3 py-1.5 text-[11px] font-heading font-semibold tracking-[1.5px] uppercase transition-colors ${
        isActive
          ? "text-house-lights"
          : "text-aluminum/60 hover:text-house-lights"
      }`}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-signal-orange rounded-full" />
      )}
    </Link>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [addingRole, setAddingRole] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) await loadProfile(session.user.id);
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error) console.error("NavBar: Failed to load profile:", error.message);
    setProfile(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setMenuOpen(false);
    window.location.href = "/";
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const roles: string[] = profile?.roles || (profile?.user_type ? [profile.user_type] : []);
  const activeRole = profile?.user_type;
  const otherRole = activeRole === "tech" ? "producer" : "tech";
  const hasBothRoles = roles.length >= 2;

  const handleSwitchRole = async () => {
    if (!user || switching) return;
    setSwitching(true);
    await supabase.from("profiles").update({ user_type: otherRole }).eq("id", user.id);
    window.location.reload();
  };

  const handleAddRole = async () => {
    if (!user || addingRole) return;
    setAddingRole(true);
    const newRoles = [...roles, otherRole];

    if (otherRole === "tech") {
      await supabase.from("tech_profiles").insert({ user_id: user.id });
    }

    await supabase.from("profiles").update({
      roles: newRoles,
      user_type: otherRole,
    }).eq("id", user.id);

    window.location.href = "/onboarding";
  };

  if (HIDDEN_ROUTES.includes(pathname) || pathname.startsWith("/card/")) return null;

  return (
    <nav className="sticky top-0 z-50 px-6 py-2 flex justify-between items-center bg-blackout/95 backdrop-blur-md border-b border-ink/[0.06] print:hidden">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center">
          <svg width="110" height="28" viewBox="0 0 200 50" fill="none">
            <text x="100" y="33" fontFamily="Oswald, 'Arial Black', sans-serif" fontWeight="700" fontSize="36" fill="var(--color-house-lights)" textAnchor="middle" letterSpacing="4">TRUSS</text>
            <line x1="36" y1="40" x2="164" y2="40" stroke="var(--color-signal-orange)" strokeWidth="2" />
            <line x1="36" y1="44" x2="164" y2="44" stroke="var(--color-signal-orange)" strokeWidth="0.5" />
          </svg>
        </Link>

        {authReady && user && (
          <div className="hidden md:flex items-center">
            <NavLink href="/browse" pathname={pathname}>Browse</NavLink>
            {profile?.user_type === "producer" && (
              <NavLink href="/projects" pathname={pathname}>Projects</NavLink>
            )}
            <NavLink href="/bookings" pathname={pathname}>Bookings</NavLink>
            {profile?.user_type === "producer" && (
              <>
                <NavLink href="/invoices" pathname={pathname}>Invoices</NavLink>
                <NavLink href="/billing" pathname={pathname}>Billing</NavLink>
              </>
            )}
            <NavLink href="/messages" pathname={pathname}>Messages</NavLink>

            {/* Separator */}
            <div className="w-px h-4 bg-ink/[0.06] mx-2" />

            <NavLink href="/forum" pathname={pathname}>Forum</NavLink>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {authReady && user && (
          <div className="hidden md:flex items-center">
            <NavLink href="/resources" pathname={pathname}>Resources</NavLink>
            {profile?.is_admin && (
              <>
                <div className="w-px h-4 bg-ink/[0.06] mx-1" />
                <Link
                  href="/admin"
                  className={`relative px-3 py-1.5 text-[11px] font-heading font-semibold tracking-[1.5px] uppercase transition-colors ${
                    pathname.startsWith("/admin")
                      ? "text-signal-orange"
                      : "text-signal-orange/60 hover:text-signal-orange"
                  }`}
                >
                  Admin
                  {pathname.startsWith("/admin") && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-signal-orange rounded-full" />
                  )}
                </Link>
              </>
            )}
          </div>
        )}

        {!authReady ? (
          <div className="w-24 h-8" />
        ) : !user ? (
          <div className="flex items-center gap-1">
            <div className="hidden md:flex items-center">
              <NavLink href="/forum" pathname={pathname}>Forum</NavLink>
              <NavLink href="/resources" pathname={pathname}>Resources</NavLink>
            </div>
            <Link href="/resources" className="md:hidden px-3 py-1.5 text-[11px] font-heading font-semibold tracking-[1.5px] uppercase text-aluminum/60 hover:text-house-lights transition-colors">
              Resources
            </Link>

            {/* Separator */}
            <div className="hidden md:block w-px h-4 bg-ink/[0.06] mx-2" />

            {/* Theme toggle (guest) */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-1.5 rounded-md text-aluminum/50 hover:text-house-lights hover:bg-ink/[0.06] transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
            )}

            <Link
              href="/login"
              className="px-4 py-1.5 text-[11px] font-heading font-semibold tracking-[1.5px] uppercase text-aluminum/70 hover:text-house-lights border border-ink/[0.08] rounded hover:border-white/15 transition-all"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-1.5 text-[11px] font-heading font-semibold tracking-[1.5px] uppercase bg-signal-orange text-white rounded hover:bg-orange-600 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        ) : (
          <div className="relative flex items-center gap-2">
            {user && <NotificationBell userId={user.id} />}
            <button onClick={toggleMenu}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md border transition-all ${
                menuOpen
                  ? "bg-deep-stage border-signal-orange/20"
                  : "bg-deep-stage/50 border-ink/[0.06] hover:border-white/10 hover:bg-deep-stage"
              }`}>
              <div className="w-7 h-7 rounded-full bg-signal-orange/15 flex items-center justify-center text-[10px] font-heading font-bold text-signal-orange">
                {profile?.display_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
              </div>
              <span className="text-[11px] font-heading font-semibold tracking-wide text-aluminum/80 hidden sm:inline">
                {profile?.display_name || "Profile"}
              </span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`transition-transform ${menuOpen ? "rotate-180" : ""}`}>
                <path d="M1 1L5 5L9 1" stroke="var(--color-aluminum)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {menuOpen && (
              <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 bg-deep-stage border border-ink/[0.08] rounded-lg shadow-2xl shadow-black/40 py-1 z-50">
                <div className="px-4 py-3 border-b border-ink/[0.06]">
                  <div className="text-sm font-heading font-semibold tracking-wide">{profile?.display_name || user?.email}</div>
                  <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase mt-0.5">{activeRole || "account"}</div>
                </div>
                {/* Role switcher / Add role */}
                {profile && hasBothRoles && (
                  <div className="px-4 py-3 border-b border-ink/[0.06]">
                    <div className="text-[9px] font-mono text-aluminum/40 tracking-[2px] uppercase mb-2">Active Role</div>
                    <div className="flex bg-blackout rounded-md p-0.5">
                      {(["tech", "producer"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={r !== activeRole ? handleSwitchRole : undefined}
                          disabled={switching}
                          className={`flex-1 py-1 rounded text-[11px] font-heading font-semibold tracking-wider uppercase transition-all ${
                            r === activeRole
                              ? "bg-signal-orange/15 text-signal-orange"
                              : "text-aluminum hover:text-house-lights"
                          } ${switching ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {r === "tech" ? "Tech" : "Producer"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {profile && !hasBothRoles && (
                  <button
                    onClick={handleAddRole}
                    disabled={addingRole}
                    className="w-full text-left px-4 py-2.5 text-xs font-heading font-semibold tracking-wide text-signal-orange hover:bg-ink/[0.03] border-b border-ink/[0.06] transition-colors disabled:opacity-50"
                  >
                    {addingRole ? "Adding..." : `Also a ${otherRole}? Add it`}
                  </button>
                )}
                {/* Mobile nav links */}
                <div className="md:hidden border-b border-ink/[0.06]">
                  {[
                    { href: "/browse", label: "Browse" },
                    ...(profile?.user_type === "producer" ? [{ href: "/projects", label: "Projects" }] : []),
                    { href: "/bookings", label: "Bookings" },
                    ...(profile?.user_type === "producer" ? [
                      { href: "/invoices", label: "Invoices" },
                      { href: "/billing", label: "Billing" },
                    ] : []),
                    { href: "/messages", label: "Messages" },
                    { href: "/resources", label: "Resources" },
                    { href: "/forum", label: "Forum" },
                    ...(profile?.is_admin ? [{ href: "/admin", label: "Admin" }] : []),
                  ].map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`block px-4 py-2 text-[12px] font-heading font-semibold tracking-wide transition-colors ${
                        pathname === item.href || pathname.startsWith(item.href + "/")
                          ? "text-house-lights bg-ink/[0.03]"
                          : "text-aluminum/60 hover:text-house-lights hover:bg-ink/[0.03]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                {!profile && (
                  <div className="px-4 py-2.5 text-xs text-standby-amber border-b border-ink/[0.06]">
                    Profile missing — <Link href="/signup" onClick={() => setMenuOpen(false)} className="underline">set up</Link>
                  </div>
                )}

                {/* Account links */}
                <div className="py-1">
                  {profile?.user_type === "tech" && (
                    <>
                      <Link href="/edit-profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-[12px] font-heading font-semibold tracking-wide text-aluminum/60 hover:text-house-lights hover:bg-ink/[0.03] transition-colors">
                        Edit Profile
                      </Link>
                      <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-[12px] font-heading font-semibold tracking-wide text-aluminum/60 hover:text-house-lights hover:bg-ink/[0.03] transition-colors">
                        Dashboard
                      </Link>
                      <Link href="/availability" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-[12px] font-heading font-semibold tracking-wide text-aluminum/60 hover:text-house-lights hover:bg-ink/[0.03] transition-colors">
                        Availability
                      </Link>
                    </>
                  )}
                  {profile?.user_type === "producer" && (
                    <>
                      <Link href="/invoices" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-[12px] font-heading font-semibold tracking-wide text-aluminum/60 hover:text-house-lights hover:bg-ink/[0.03] transition-colors">
                        Invoices
                      </Link>
                      <Link href="/billing" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-[12px] font-heading font-semibold tracking-wide text-aluminum/60 hover:text-house-lights hover:bg-ink/[0.03] transition-colors">
                        Billing & Payments
                      </Link>
                      <Link href="/favorites" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-[12px] font-heading font-semibold tracking-wide text-aluminum/60 hover:text-house-lights hover:bg-ink/[0.03] transition-colors">
                        Saved Techs
                      </Link>
                    </>
                  )}
                  <Link href="/bookings" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-[12px] font-heading font-semibold tracking-wide text-aluminum/60 hover:text-house-lights hover:bg-ink/[0.03] transition-colors">
                    My Bookings
                  </Link>
                  <Link href="/settings" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-[12px] font-heading font-semibold tracking-wide text-aluminum/60 hover:text-house-lights hover:bg-ink/[0.03] transition-colors">
                    Settings
                  </Link>
                </div>

                {/* Theme toggle */}
                {mounted && (
                  <div className="border-t border-ink/[0.06]">
                    <button
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-[12px] font-heading font-semibold tracking-wide text-aluminum/60 hover:text-house-lights hover:bg-ink/[0.03] transition-colors"
                    >
                      {theme === "dark" ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="5" />
                          <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                      )}
                      {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </button>
                  </div>
                )}

                <div className="border-t border-ink/[0.06]">
                  <button onClick={handleSignOut} className="w-full text-left px-4 py-2.5 text-[12px] font-heading font-semibold tracking-wide text-red-400/80 hover:text-red-400 hover:bg-ink/[0.03] transition-colors">
                    Sign Out
                  </button>
                </div>
              </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
