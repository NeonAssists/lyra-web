'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type User = { id: string; handle: string; display_name: string; avatar_url: string | null };

const NAV = [
  { href: '/app',    label: 'Home' },
  { href: '/music',  label: 'Music' },
  { href: '/ranked', label: 'Ranked' },
  { href: '/social', label: 'Social' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      const { data: p } = await supabase.from('profiles')
        .select('id, handle, display_name, avatar_url').eq('id', data.user.id).single();
      setMe(p as User);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_ev, session) => {
      if (session?.user) {
        const { data: p } = await supabase.from('profiles')
          .select('id, handle, display_name, avatar_url').eq('id', session.user.id).single();
        setMe(p as User);
      } else {
        setMe(null);
        router.push('/login');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      {/* Top nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]"
        style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-8">
          {/* Logo */}
          <Link href="/app" className="text-base font-black tracking-tight text-white shrink-0">Lyra</Link>

          {/* Nav links — desktop */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV.map(({ href, label }) => {
              const active = pathname === href || (label !== 'Home' && pathname.startsWith(href) && href !== '/app');
              return (
                <Link key={label} href={href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-white/10 text-white' : 'text-[#8E8E93] hover:text-white hover:bg-white/5'
                  }`}>
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0">
            {me ? (
              <div className="relative">
                <button onClick={() => setMenuOpen(v => !v)}
                  className="flex items-center gap-2 rounded-full hover:bg-white/5 px-2 py-1 transition-colors">
                  {me.avatar_url
                    ? <img src={me.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                    : <div className="w-7 h-7 rounded-full bg-[#6C63FF] flex items-center justify-center text-xs font-bold">
                        {(me.display_name || me.handle || '?')[0].toUpperCase()}
                      </div>}
                  <span className="text-sm font-medium text-white hidden sm:block">@{me.handle}</span>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-[#636366]"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#1c1c1e] border border-white/10 rounded-2xl overflow-hidden shadow-xl z-50"
                    onMouseLeave={() => setMenuOpen(false)}>
                    <Link href={`/u/${me.handle}`} onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      Profile
                    </Link>
                    <div className="h-px bg-white/10" />
                    <button onClick={signOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#FF453A] hover:bg-white/5 transition-colors">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="text-sm font-semibold bg-[#6C63FF] text-white px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity">
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button className="md:hidden text-[#8E8E93]" onClick={() => setMenuOpen(v => !v)}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-[#0a0a0a] px-4 py-3 flex flex-col gap-1">
            {NAV.map(({ href, label }) => (
              <Link key={label} href={href} onClick={() => setMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(href) && (label === 'Home' ? pathname === href : true)
                    ? 'bg-white/10 text-white' : 'text-[#8E8E93] hover:text-white'
                }`}>
                {label}
              </Link>
            ))}
            {me && (
              <>
                <div className="h-px bg-white/10 my-1" />
                <Link href={`/u/${me.handle}`} onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-[#8E8E93] hover:text-white">
                  Profile (@{me.handle})
                </Link>
                <button onClick={signOut} className="px-3 py-2 rounded-lg text-sm font-medium text-[#FF453A] text-left">
                  Sign Out
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="pt-14">
        {children}
      </main>
    </div>
  );
}
