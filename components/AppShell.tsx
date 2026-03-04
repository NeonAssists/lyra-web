'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type User = { id: string; handle: string; display_name: string; avatar_url: string | null };

const NAV = [
  { href: '/app', label: 'Home', icon: (active: boolean) => <svg width="20" height="20" fill={active ? 'white' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg> },
  { href: '/music', label: 'Music', icon: (active: boolean) => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="8" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M11 18V6l10-2v10"/></svg> },
  { href: '/charts', label: 'Charts', icon: (active: boolean) => <svg width="20" height="20" fill={active ? 'white' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg> },
  { href: '/ranked', label: 'My Ratings', icon: (active: boolean) => <svg width="20" height="20" fill={active ? 'white' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { href: '/social', label: 'Friends', icon: (active: boolean) => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loadProfile = async (uid: string) => {
      const { data: p } = await supabase.from('profiles').select('id, handle, display_name, avatar_url').eq('id', uid).single();
      setMe(p as User);
    };
    // onAuthStateChange fires INITIAL_SESSION on first hydration from localStorage
    // This is the reliable way to detect auth state on page load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setHydrated(true);
      if (session?.user) {
        loadProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setMe(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); window.location.href = '/'; };

  return (
    <>
      <style>{`
        .lyra-sidebar { display: flex; }
        .lyra-bottom-nav { display: none; }
        .lyra-main { padding-bottom: 0; }
        @media (max-width: 768px) {
          .lyra-sidebar { display: none !important; }
          .lyra-bottom-nav { display: flex !important; }
          .lyra-main { padding-bottom: 80px; }
          .lyra-shell { flex-direction: column; }
        }
      `}</style>

      <div className="lyra-shell" style={{ display: 'flex', minHeight: '100vh', background: '#000', color: '#fff' }}>

        {/* Sidebar — desktop only */}
        <aside className="lyra-sidebar" style={{
          width: 240, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
          flexDirection: 'column',
          background: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.06)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        }}>
          <div style={{ padding: '28px 24px 20px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>Lyra</span>
            </Link>
          </div>

          <nav style={{ padding: '0 12px', flex: 1 }}>
            {NAV.map(({ href, label, icon }) => {
              const active = pathname === href || (label !== 'Home' && pathname.startsWith(href));
              return (
                <Link key={label} href={href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                    background: active ? 'rgba(108,99,255,0.15)' : 'transparent',
                    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                    fontSize: 14, fontWeight: active ? 700 : 500,
                    transition: 'all 0.15s',
                  }}>
                    <span style={{ color: active ? '#6C63FF' : 'inherit', flexShrink: 0 }}>{icon(active)}</span>
                    {label}
                    {active && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#6C63FF' }} />}
                  </div>
                </Link>
              );
            })}
          </nav>

          {me ? (
            <div style={{ padding: '16px 16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
              <button onClick={() => setUserMenuOpen(v => !v)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 12,
                padding: '10px 12px', cursor: 'pointer', color: '#fff',
              }}>
                {me.avatar_url
                  ? <img src={me.avatar_url} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                  : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#6C63FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {(me.display_name || me.handle || '?')[0].toUpperCase()}
                    </div>}
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{me.display_name || me.handle}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>@{me.handle}</p>
                </div>
                <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {userMenuOpen && (
                <div style={{ position: 'absolute', bottom: '100%', left: 16, right: 16, background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 -8px 32px rgba(0,0,0,0.5)', marginBottom: 8 }}>
                  <Link href={`/u/${me.handle}`} onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#fff', textDecoration: 'none', fontSize: 14 }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    View Profile
                  </Link>
                  <Link href="/account" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#fff', textDecoration: 'none', fontSize: 14 }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    Account & Billing
                  </Link>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
                  <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#FF453A', background: 'none', border: 'none', cursor: 'pointer', width: '100%', fontSize: 14, textAlign: 'left' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '16px 16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Link href="/login" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
                background: '#6C63FF', border: 'none', borderRadius: 12,
                padding: '12px 12px', textDecoration: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
              }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                Sign In
              </Link>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="lyra-main" style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          {children}
        </main>

        {/* Bottom nav — mobile only */}
        <nav className="lyra-bottom-nav" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          justifyContent: 'space-around', alignItems: 'center',
          padding: '10px 0 max(10px, env(safe-area-inset-bottom))',
        }}>
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href || (label !== 'Home' && pathname.startsWith(href));
            return (
              <Link key={label} href={href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                <span style={{ color: active ? '#6C63FF' : 'rgba(255,255,255,0.4)', transition: 'color 0.15s' }}>{icon(active)}</span>
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'color 0.15s' }}>{label}</span>
              </Link>
            );
          })}
          {me ? (
            <button onClick={() => setMobileMenuOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, padding: 0 }}>
              {me.avatar_url
                ? <><img src={me.avatar_url} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} alt="" onError={(e) => { const img = e.target as HTMLImageElement; img.style.display = "none"; const next = img.nextElementSibling as HTMLElement; if (next) next.style.display = "flex"; }} /><div style={{ display: "none", width: 20, height: 20, borderRadius: "50%", background: "#6C63FF", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>{(me.display_name || me.handle || '?')[0].toUpperCase()}</div></>
                : <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#6C63FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>
                    {(me.display_name || me.handle || '?')[0].toUpperCase()}
                  </div>}
              <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>Me</span>
            </button>
          ) : (
            <Link href="/login" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
              <svg width="20" height="20" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>Sign In</span>
            </Link>
          )}
        </nav>

        {/* Mobile profile bottom sheet */}
        {mobileMenuOpen && me && (
          <>
            <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }} />
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1c1c1e', borderRadius: '20px 20px 0 0', padding: '20px 0 max(20px, env(safe-area-inset-bottom)) 0', zIndex: 201 }}>
              <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '0 auto 20px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px 16px' }}>
                {me.avatar_url
                  ? <img src={me.avatar_url} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                  : <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#6C63FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {(me.display_name || me.handle || '?')[0].toUpperCase()}
                    </div>}
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{me.display_name || me.handle}</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>@{me.handle}</p>
                </div>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 24px' }} />
              <Link href={`/u/${me.handle}`} onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 24px', color: '#fff', textDecoration: 'none', fontSize: 16 }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                View Profile
              </Link>
              <Link href="/account" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 24px', color: '#fff', textDecoration: 'none', fontSize: 16 }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Account & Billing
              </Link>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 24px' }} />
              <button onClick={() => { setMobileMenuOpen(false); signOut(); }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 24px', color: '#FF453A', background: 'none', border: 'none', cursor: 'pointer', width: '100%', fontSize: 16, textAlign: 'left' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </button>
            </div>
          </>
        )}

      </div>
    </>
  );
}
