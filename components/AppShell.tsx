'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

const BASE_NAV = [
  { href: '/app',    label: 'Home',    Icon: HomeIcon },
  { href: '/music',  label: 'Music',   Icon: MusicIcon },
  { href: '/ranked', label: 'Ranked',  Icon: StarIcon },
  { href: '/social', label: 'Social',  Icon: UsersIcon },
  { href: '/profile',label: 'Profile', Icon: PersonIcon },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [me, setMe] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await supabase.from('profiles')
          .select('id, handle, display_name, avatar_url').eq('id', data.user.id).single();
        setMe(p as User);
      }
    });
  }, []);

  const navItems = BASE_NAV.map(n => ({
    ...n,
    href: n.href === '/profile' && me ? `/u/${me.handle}` : n.href,
  }));

  const initials = me ? (me.display_name ?? me.handle).slice(0, 2).toUpperCase() : '';

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-56 border-r border-white/[0.06] p-4 fixed top-0 left-0 h-full z-30 bg-[#0a0a0a]">
        <Link href="/" className="text-2xl font-black tracking-tight mb-8 mt-2 block text-white">
          Lyra
        </Link>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== '/app' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  active ? 'bg-[#6C63FF]/15 text-[#6C63FF]' : 'text-[#8E8E93] hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <Icon active={active} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User row at bottom */}
        <div className="mt-4 border-t border-white/[0.06] pt-4">
          {me ? (
            <Link href={`/u/${me.handle}`} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-colors">
              {me.avatar_url ? (
                <div className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                  <Image src={me.avatar_url} alt={me.display_name} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#6C63FF] flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate text-white">{me.display_name}</p>
                <p className="text-[11px] text-[#8E8E93] truncate">@{me.handle}</p>
              </div>
            </Link>
          ) : (
            <Link href="/login" className="block text-sm font-semibold text-[#6C63FF] px-3 py-2">
              Sign in
            </Link>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-56 min-h-screen pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom nav — mobile */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/[0.06] flex items-center justify-around px-2 py-2 z-30">
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/app' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${active ? 'text-[#6C63FF]' : 'text-[#8E8E93]'}`}
            >
              <Icon active={active} />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
