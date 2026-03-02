'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

type User = { id: string; handle: string; display_name: string; avatar_url: string | null };

function HomeIcon({ active }: { active: boolean }) {
  return <svg width="22" height="22" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg>;
}
function MusicIcon({ active }: { active: boolean }) {
  return <svg width="22" height="22" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="8" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M11 18V6l10-2v10"/></svg>;
}
function StarIcon({ active }: { active: boolean }) {
  return <svg width="22" height="22" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
function UsersIcon({ active }: { active: boolean }) {
  return <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function PersonIcon({ active }: { active: boolean }) {
  return <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function SignOutIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}

const BASE_NAV = [
  { href: '/app',    label: 'Home',    Icon: HomeIcon },
  { href: '/music',  label: 'Music',   Icon: MusicIcon },
  { href: '/ranked', label: 'Ranked',  Icon: StarIcon },
  { href: '/social', label: 'Social',  Icon: UsersIcon },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [showSignOut, setShowSignOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await supabase.from('profiles')
          .select('id, handle, display_name, avatar_url').eq('id', data.user.id).single();
        setMe(p as User);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: p } = await supabase.from('profiles')
          .select('id, handle, display_name, avatar_url').eq('id', session.user.id).single();
        setMe(p as User);
      } else {
        setMe(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMe(null);
    setShowSignOut(false);
    router.push('/');
  };

  const navItems = [
    ...BASE_NAV,
    { href: me ? `/u/${me.handle}` : '/login', label: 'Profile', Icon: PersonIcon },
  ];

  const initials = me ? (me.display_name ?? me.handle).slice(0, 2).toUpperCase() : '';

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 border-r border-white/[0.06] p-5 fixed top-0 left-0 h-full z-30 bg-[#0a0a0a]">
        <Link href="/" className="text-2xl font-black tracking-tight mb-8 mt-1 block text-white">
          Lyra <span className="text-[#6C63FF]">⚡</span>
        </Link>
        <nav className="flex flex-col gap-0.5 flex-1">
          {navItems.map(({ href, label, Icon }) => {
            const active = pathname === href || (label !== 'Home' && pathname.startsWith(href.split('?')[0]) && href !== '/app');
            return (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-[#6C63FF]/15 text-[#6C63FF]'
                    : 'text-[#8E8E93] hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <Icon active={active} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User row at bottom */}
        <div className="mt-4 border-t border-white/[0.06] pt-4 relative">
          {me ? (
            <>
              <button
                onClick={() => setShowSignOut(v => !v)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-colors w-full text-left"
              >
                {me.avatar_url ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    <Image src={me.avatar_url} alt={me.display_name} fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#4f46e5] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate text-white">{me.display_name}</p>
                  <p className="text-[11px] text-[#8E8E93] truncate">@{me.handle}</p>
                </div>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-[#48484A] flex-shrink-0"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {showSignOut && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1c1c1e] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl z-50">
                  <Link href={`/u/${me.handle}`} className="flex items-center gap-2.5 px-4 py-3 text-sm text-white hover:bg-white/[0.04] transition-colors" onClick={() => setShowSignOut(false)}>
                    <PersonIcon active={false} />
                    View profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-white/[0.04] transition-colors w-full text-left border-t border-white/[0.06]"
                  >
                    <SignOutIcon />
                    Sign out
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link href="/login" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#6C63FF] hover:bg-[#6C63FF]/10 transition-colors">
              Sign in →
            </Link>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-60 min-h-screen pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom nav — mobile */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/[0.06] flex items-center justify-around px-1 py-2 z-30 safe-bottom">
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href || (label !== 'Home' && pathname.startsWith(href.split('?')[0]) && href !== '/app');
          return (
            <Link
              key={label}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-0 ${active ? 'text-[#6C63FF]' : 'text-[#8E8E93]'}`}
            >
              <Icon active={active} />
              <span className="text-[9px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
